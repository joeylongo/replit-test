// import { OpenAI } from "@llamaindex/openai";
import {
  StartEvent,
  StopEvent,
  WorkflowEvent,
  HandlerContext,
} from "llamaindex";
import { Workflow } from "@llamaindex/workflow";
import axios from "axios";
import ollama from "ollama";
import samples from "../samples/datafiles/100-picos-samples.json";
import { systemPrompt } from "../workflow/contexts/systemContext";
import fs from 'fs'
import { appendFile } from 'node:fs/promises';

/**
 * stripHtmlTags
 * -------------
 * Removes all HTML/XML tags and decodes common HTML entities.
 *
 * @param html - A string that may contain markup.
 * @returns The plain-text version.
 */
export function stripHtmlTags(html: string): string {
  if (!html) return "";

  // 1️⃣  Use the DOM when it’s available (browser, jsdom, etc.)
  if (typeof window !== "undefined" && "DOMParser" in window) {
    const parser = new DOMParser();
    // Treat it as text/html so entities are decoded automatically
    const doc = parser.parseFromString(html, "text/html");
    return doc.body.textContent ?? "";
  }

  // 2️⃣  Fallback for Node without DOM: quick-and-dirty regex
  //     (good enough for simple snippets; not for malformed markup)
  return html
    .replace(/<[^>]*>/g, "") // strip tags
    .replace(/&nbsp;/gi, " ") // common entity
    .replace(/&([a-z]+);/gi, (_, entity) => {
      // basic entity decode
      const map: Record<string, string> = {
        amp: "&",
        lt: "<",
        gt: ">",
        quot: '"',
        apos: "'",
      };
      return map[entity] ?? "";
    })
    .trim();
}

export function jsonToPlainText(obj: Record<string, unknown>): string {
  return Object.entries(obj)
    .map(([key, value]) =>
      value !== "" ? `${key}: ${String(value)}` : undefined
    )
    .join("\n");
}

export async function appendCsvLine(
  filePath: string,
  fields: unknown[],
): Promise<void> {
  const line = `${fields.join(',')}\n`;
  await appendFile(filePath, line, 'utf8');
}

const go = async () => {
  let csv = ''
  let i = 0
  let start = false
  for (const sample of samples) {
    if(sample.Id === 'a15a6000001ilRRAAY') {
      start = true
      continue
    }
    if(!start) {
      console.log('skipping',sample.Id)
      continue
    }
    i++
    const otherSystemPrompt = `You are an AI agent with knowledge about how a beverage company relays promotion execution strategy to front line sales.
The company has promotions which involve setting up special product displays in-store.
You are in the execution enablement group which is responsible for keeping track of the promotions and articulating to front-line sales people about how to set up the displays.
This groups creates a PicOS (Picture of Success) record in salesforce that tracks the promotion (for example, "March Madness") and the bottlers the promotion affects.
Each PicOS has a number of activities that each relate to a specific store, a number of their doors, and specific products/displays.

Here is the guide on what makes a good activity:
**Action Item Rules of Engagement **
Our associates should have no more than 10-12 Action Items at a time
If you have activity spanning multiple months, a new AI should be submitted for each month of execution
Action Items should always describe the 5 Ps: Product, Package, Point of Sale, Price and Placement
For MSC Action Items, detail necessary products/packages necessary for execution
Action Item Prioritization should encompass:
Customer initiatives and price promotions
Channel Big Bets
Market Street Challenge priorities
Incremental Brand Partner AIs  
Use AIs to verify POS execution IF there is a price promo and should include execution direction
For example, “Execute ordering extra inventory to support Peace Tea promotion 2/$2.50 supported by poster”
Include process for replacement POS or refusal to execute
Product allocations should be considered prior to submitting an action item. If possible, include a replacement product should something be out of stock
HQM vs. LSI: If the action item requires a selling conversation with a store manager, it is an LSI
For example, a coop might have Core Power in a POG progression, but the product still needs to be sold at the outlet level
Segment HQM action items when activity is store specific

**“PicOS” Look of Success**
Action Item verbiage (Execution Details) must clearly detail the intended execution, including Brand, Package, Point of Sale, Price and ideal Location
For example, “Sell in 4x3 Merchandising Rack and/or display in the perimeter with 2L Fanta flavors at 4/$5. Activate with Fanta Halloween graphics from the POS Store."
Detail MSC specific brands/packages when applicable
For example, “Execute a 12 Pack end with including Coke, Diet Coke, Coke Zero Sugar, Sprite and Fanta Orange at 3/$12. Wing 6 Pack ½ Liter at 2/$6. Activate Big Game POS from the POS Store.
Include baseline MSC Score in Verify
Include appropriate naming conventions (see details)
Every action item should include a picture of the desired execution
Priority HQM and ALL LSI action items should include a Sell Sheet:
Detail “Why”: Why this product? Why this program/messaging? Why this location?
Where possible, include product margin
Include link to appropriate POS on POS Store (Key Account folder or General Market  Program folder)

Tips for improving existing Execution Details:
  - Sometimes the person who originally wrote the Execution Details will include extra information that is not present in any data the Salesforce Record.
    If you identify words and phrases like this, then you should try to include them in the new rewritten Execution Details despite these terms not existing anywher else.
    The reason is that someone probably had some special knowledge not captured anywhere so that should be retained.
  - Try to prefer easy to understand layman's terminology over acronyms and jargon within reason. For example: SSD: 12x355ml is more confusing than 12-pack Core CAN display.
  - Do not repeat information. Try to detect if an acronym or term is restating the same concept as another portion of the Execution Details. For example you don't need to write: "12-pack Core CAN display (SSD: 12x355ml)" as this is repetive. Space is at a premium.
  - Certain words that exist only in the execution details should be weighted higher for inclusion in the newly rewritten Execution details.
    This includes words like: Shipper, pallet drop, storage bin. You are allowed to also come up with other words to weight highly if you think they belong in the same category as the given words.

**Action Item Naming Conventions**
***Naming conventions allow us to track execution specific to strategic initiatives. These results are indicators of volume/revenue performance.***
MSC: Market Street Challenge
Big Bets:
  - BBIC: Immediate Consumption
  - BBW: Water
  - BBE: Energy
  - BBIso: Isotonics
  - BBFC: Future Consumption

Pillar Programs:
  - BG: Big Game
  - MM: March Madness
  - Sum: Summer
  - KOC: Coke Creations
  - FF: Fall Football
  - Hol: Holiday

Your job is to focus on what good "Execution Details" look like. Execution Details is another term for the Action Item verbiage or "execution direction" referred to in the guide above.
The "“PicOS” Look of Success" section of the guide covers good execution details.
The Execution Details should refer to the Action Item Naming Conventions in the guide where applicable. For example, if the activity is "Market Street Challenge" = Yes, then put "MSC" somwhere to track it.

Execution details need to be 265 characters or less (not counting HTML tags).
Execution details may not include links or images, they are just a concise paragraph aimed at providing maximum execution direction in limited space.
You if asked to generate Execution details, you should return HTML markup. Please use font weights, different font colors, and underlining to group the information in the best way, and return your response in HTML markup instead of plain text.
Please color code the "Activity Type" where "Execute" is red, "Sell" is gray, and "Hunt" is gold. 
`;
    const prompt = `Please rewrite the provided Execution Details and make them better based on what you know about what makes good Exection Details for a PicOS activity.

Here is the Acitivity record from salesforce:
${jsonToPlainText(sample)}

Here is the Execution Details (Action Item verbiage) I want you to evaluate:
${sample.Product_Price_Execution_Direction__c}

Please responsd with ONLY a re-written Execution Details (improvedExecutionDetails) to get it as high quality as possible given the information in the salesforce record.
Do not include any other commentary or reasoning.
`;
    console.log(
      "===================================================================================="
    );
    console.log("Activity Name/Id:");
    console.log(sample.Activity_Name__c, sample.Id);
    console.log("Original Execution Details:");
    console.log(stripHtmlTags(sample.Product_Price_Execution_Direction__c));
    const res = await ollama.chat({
      model: "gemma3:4b",
      messages: [
        // { role: "system", content: systemPrompt },
        { role: "system", content: otherSystemPrompt },
        { role: "user", content: prompt },
      ],
      format: {
        type: "object",
        properties: {
          rating: {
            type: "string",
          },
          improvedExecutionDetails: {
            type: "string",
          },
        },
        required: ["rating", "improvedExecutionDetails"],
      },
    });

    const original = stripHtmlTags(sample.Product_Price_Execution_Direction__c)
    const generated = stripHtmlTags(JSON.parse(res.message.content).improvedExecutionDetails)
    const link = `https://ccnag.lightning.force.com/lightning/r/Activation__c/${sample.Id}/view`
    const line = `${sample.Activity_Name__c},${original.replace(',', ';')},${generated.replace(',', ';')},${link}\n`
    console.log("Generated Execution Details:");
    console.log(stripHtmlTags(JSON.parse(res.message.content).improvedExecutionDetails));
    await appendFile('./activity-examples.csv', line, 'utf8');
  }
  fs.writeFileSync('./activity-examples.csv', csv)
};

go();
