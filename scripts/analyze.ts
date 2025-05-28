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
import { systemPrompt } from '../workflow/contexts/systemContext'

export function jsonToPlainText(obj: Record<string, unknown>): string {
  return Object.entries(obj)
    .map(([key, value]) =>
      value !== "" ? `${key}: ${String(value)}` : undefined
    )
    .join("\n");
}

const go = async () => {
  for (const sample of samples) {
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
Action Item verbiage must clearly detail the intended execution, including Brand, Package, Point of Sale, Price and ideal Location
For example, “Sell in 4x3 Merchandising Rack and/or display in the perimeter with 2L Fanta flavors at 4/$5. Activate with Fanta Halloween graphics from the POS Store. 
Detail MSC specific brands/packages when applicable
For example, “Execute a 12 Pack end with including Coke, Diet Coke, Coke Zero Sugar, Sprite and Fanta Orange at 3/$12. Wing 6 Pack ½ Liter at 2/$6. Activate Big Game POS from the POS Store.
Include baseline MSC Score in Verify
Include appropriate naming conventions (see details)
Every action item should include a picture of the desired execution
Priority HQM and ALL LSI action items should include a Sell Sheet:
Detail “Why”: Why this product? Why this program/messaging? Why this location?
Where possible, include product margin
Include link to appropriate POS on POS Store (Key Account folder or General Market  Program folder)

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

You will mainly focus on what good "Execution Details" look like. Execution Details is another term for the Action Item verbiage in the guide.
The "“PicOS” Look of Success" section of the guide covers good execution details.
The Execution Details should refer to the Action Item Naming Conventions in the guide where applicable. For example, if the activity is "Market Street Challenge" = Yes, then put "MSC" somwhere to track it.

Execution details need to be 265 characters or less (not counting HTML tags).
Execution details may not include links or images, they are just a concise paragraph aimed at providing maximum execution direction in limited space.
You if asked to generate Execution details, you should return HTML markup. Please use font weights, different font colors, and underlining to group the information in the best way, and return your response in HTML markup instead of plain text.
Please color code the "Activity Type" where "Execute" is red, "Sell" is gray, and "Hunt" is gold. 
`;
    const prompt = `Please evalute this sample Execution Details for a PicOS activity. I'd like you to rate it on a scale of 0-100% in terms of quality based on what you know about how execution direcitons should be written.

Here is the Acitivity record from salesforce:
${jsonToPlainText(sample)}

Here is the Execution Details (Action Item verbiage) I want you to evaluate:
${sample.Product_Price_Execution_Direction__c}

Please responsd with ONLY your rating and a re-written Execution Details (improvedExecutionDetails) to get it as close to 100% as possible given the information in the salesforce record.
Do not include any other commentary or reasoning.
`;
    console.log(
      "===================================================================================="
    );
    console.log("Activity Name/Id:");
    console.log(sample.Activity_Name__c, sample.Id);
    console.log("Original Execution Details:");
    console.log(sample.Product_Price_Execution_Direction__c);
    const res = await ollama.chat({
      model: "gemma3:4b",
      messages: [
        { role: 'system', content: systemPrompt },
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
    console.log("Generated Execution Details:");
    console.log(JSON.parse(res.message.content).improvedExecutionDetails);
  }
};

go();
