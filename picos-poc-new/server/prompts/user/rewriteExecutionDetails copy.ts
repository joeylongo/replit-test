export default (recordData: any, variationPrompt?: string, productHierarchys?: any[]) =>
`Please rewrite the provided Execution Details using the best practices for PicOS execution direction.

Here is the Salesforce Activity record:
${Object.entries(recordData)
  .map(([key, val]) => `- ${key}: ${val || 'Not specified'}`)
  .join('\n')}

Here are the original Execution Details:
"${recordData.Product_Price_Execution_Direction__c}"

Here is the Activity Type:
"${recordData.Activity_type__c}"

Tips for improving existing Execution Details:
  - Sometimes the person who originally wrote the Execution Details will include extra information that is not present in any data the Salesforce Record.
    If you identify words and phrases like this, then you should try to include them in the new rewritten Execution Details despite these terms not existing anywher else.
    The reason is that someone probably had some special knowledge not captured anywhere so that should be retained.
  - Try to prefer easy to understand layman's terminology over acronyms and jargon within reason. 
      For example: "SSD: 12x355ml" is more confusing than "12-pack Core CAN display". Simply write "12-pack Core CAN display" and omit "SSD: 12x355ml"
  - Certain words that exist only in the execution details should be weighted higher for inclusion in the newly rewritten Execution details.
    This includes words like: Shipper, pallet drop, storage bin. You are allowed to also come up with other words to weight highly if you think they belong in the same category as the given words.

You need to ensure that there is only one product description per activity. These are some examples of product descriptions:
${productHierarchys?.length ? productHierarchys.map(ph => `- ${ph.l2DisplayName}`).join('\n') : '- SSD Transaction Package'}

Do NOT put more than one product description in the Execution Details. If there are multiple products, you should pick the most important one and use that as the product description.
If the Execution Details already has a product description, you should not add a "Product:" description or explanation to the end of the execution details.

${productHierarchys?.length ? `Your product description must match the following: ${productHierarchys.map(ph => ph.l3DisplayName).join(', ')}` : ''}

Activity_type__c or "Activity Type" → How to begin Execution Details:
- "Execute" or "Headquarter Mandated (HQM)" → Begin with "Execute:"
- "Sell" or "Local Sell In (LSI)" → Begin with "Sell:"
- "HUNT" or "Hunt" → Begin with "Hunt:"
- "VERIFY" or "Verify"  → Begin with "Verify:"
- Anything else → Do NOT begin with a verb unless it matches the Activity_type__c exactly.

**Guide to providing layman's terms and jargon to avoid**
Normalize any product description to the clearest layman’s version. For example:
- Normalize "SSD Core CAN 12oz x 355ml (12-pack) to "12-pack Core CAN display"
Once normalized, do NOT rephrase or restate it again.
Use the following guide to use layman's terms over acronymns and jargon. Do NOT use the following terms:
- SSD: sparkling soft drink. You dont need to include SSD because people will know which brands are SSDs.
- 12 x 355ml: You shouldn't simply copy the package types info directly. You must instead say "12 pack of Cans" since cans are always 355ml.
Here are some specific examples and how to improve them.

1) Bad examples:
    ❌ BAD: Execute 12-pack Core CAN display at the Front of Store/Lobby with SSD Core CAN 12oz x 355ml (12-pack). Implement shelf talkers with a $4.99 promo.
    ❌ BAD: Execute 12-pack Core CAN display featuring SSD Core CAN 12oz x 355ml (12 pack) at $4.99. Deploy shelf talkers to the front of store/lobby. Utilize Simple Promo: 1 can for $4.99.
    ❌ BAD: Execute 12-pack Core CAN display at the front of store/lobby featuring SSD Core CAN 12oz/355ml 12pk. Implement shelf talkers with the $4.99 Simple Promo: 1 can for $4.99.
    ❌ BAD: Execute 12-pack Core CAN display at the Front of Store/Lobby with $4.99 Simple Promo: 1 can for $4.99. Deploy shelf talkers. Product: SSD Core CAN 12z/355m 12pk.
2) Good examples:
    ✅ GOOD: Execute 12-pack Core CAN display at the Front of Store/Lobby. Implement shelf talkers with a $4.99 promo.
    ✅ GOOD: Sell: Incremental Stand-Alone Smart Water Display. 20oz Smartwater at 2/$4 TPR Activate POS (BBW) Thru 7/8
    ✅ GOOD: Verify display (running 7/20 - 8/16) TPR/AD - Team Pack Mega $5.99 (display pending - BTS program utilizing school bus display -- 68 cases 12oz 8pk pack out)
    ✅ GOOD: Execute 12-pack Core CAN display at the front of store/lobby. Implement shelf talkers with the $4.99 Simple Promo: 1 can for $4.99.
    ✅ GOOD: HUNT: Incremental 355mL Coke De Mexico Rack / Display (Must Include Sprite and/or Fanta) at $EDV or $Promo!! (MSC)
    ✅ GOOD: Execute 12-pack Core CAN display at the Front of Store/Lobby with $4.99 Simple Promo: 1 can for $4.99. Deploy shelf talkers.

**Your job**
Your job is to focus on what good "Execution Details" look like. Execution Details is another term for the Action Item verbiage or "execution direction" referred to in the guide above.
The "“PicOS” Look of Success" section of the guide covers good execution details.
The Execution Details should refer to the Action Item Naming Conventions in the guide where applicable. For example, if the activity is "Market Street Challenge" = Yes, then put "MSC" somwhere to track it.

⚠️ CRITICAL RULE: Do **NOT** include the word "Execute" in the Execution Details unless it is explicitly listed as the Activity_type__c vaue.

⚠️ CRITICAL RULE:
You must include only ONE product description in the Execution Details. If you mention "12-pack Core CAN display" or similar once, DO NOT repeat it in another format later. This includes variations like:
- SSD Core CAN 12oz x 355ml (12-pack)
- 12-pack of 12oz cans
- SSD Import GLS 12z/355m 1pk 24
- 12x355ml
- Product: SSD Core CAN 12z/355m 12pk
- Product: SSD Core CAN 12oz/355ml (12-pack)
- 12-pack Core CAN display
These are all the same thing. Choose ONE clear phrase, and DO NOT restate or rephrase the product description again. 👉 Repeating the product description in a different format is redundant and unprofessional.
Any of the following patterns are considered the same and must NOT be repeated together:
- Any phrase that begins with “Product: …”
- Any phrase that begins with “SSD Core …”
- Any phrase that begins with "12-pack Core …”
- Any phrase that contains “SSD Import GLS …”
- Any phrase that ends with “pack of Cans”
These all refer to the same concept. You MUST pick just one and use it once.

Execution details need to be 265 characters or less (not counting HTML tags).
Execution details may not include links or images, they are just a paragraph aimed at providing maximum execution direction in limited space.
You should return HTML markup. Please use font weights, different font colors, and underlining to group the information in the best way, and return your response in HTML markup instead of plain text.

⚠️ CRITICAL RULES:
- Use <strong>, <u>, and <span style="color:..."> for formatting.
- Only ONE product description is allowed. Do NOT repeat it in another format.
- Product descriptions must be normalized to layman’s terms, e.g., “SSD Core CAN 12oz x 355ml (12-pack)” becomes “12-pack Core CAN display”.
- Never restate or vary the product phrase in the same output.
- Include 5Ps: Product, Package, Point of Sale, Price, and Placement.
- Prefer human-readable over acronyms (e.g., omit SSD if it’s clear).
- Use color for verbs: <span style="color:red">Execute</span>, <span style="color:gray">Sell</span>, <span style="color:goldenrod">Hunt</span>.
- Max 265 characters (excluding HTML tags).
- Always include promotion context (e.g., MSC, MM, etc.) if available.

${variationPrompt ? `You will be responsible for providing one of 3 variations of rewritten Execution Details.
  Here are the *CRITICAL* instructions to create this variation:
${variationPrompt}` : ''}

Respond in this JSON format:
{
  "rewrittenText": "<html formatted execution details>",
  "improvements": ["Short list of improvements made"],
  "confidence": 90
}`;