export default (keyValues: string, imageSummary: string) => 
`You are trying to create simple instructions for people setting up product displays in stores.
The instructions need to be extremely simple and no more than 230 characters long.

You will use provided data in Key Value Pairs that describe the in-store promotion execution activity and a description of promotion execution images prepared by the brand to generate these instructions.
 
A good instruction set includes the price, which products and package types/sizes are included, number of stores included, relevant discount and other relevant information.
You are allowed to use industry standard acronyms and jargon to help your reponse to be brief and concise.
Please make sure brand name, flavor and packaging, as well as POI and promo details are correct in this area. Any additional execution directions to Front Line Sales can be added

Do not simply restate the structured data details. Your job is to create human-language instructions to help someone quickly read it and understand how to best set up the displays for the promotion.

Your response must be no more than 230 characters.
Respond ONLY with the instructions and no other explanation or text. Do not quote your response.

Key Value data:
${keyValues}

Description of images:
${imageSummary}`


// Here are some examples of good instructions. Try to match the style of these:
//   - "Freezer Sidecap Display. 1,328 stores. Product: SmartWater 700ml Sport Cap. Please fill display completely. Promotion: SmartWater Save 15%"
//   - "Powerade 12oz 8pack $4.88 (20% Margin). Action Alley, Grocery Cart Rail, or Grocery End Cap. Display in 100% of stores. Use March Madness POS on displays. Include all 4 SKUs on Displays"
//   - "MSC BBIso Sell in BodyArmor Shipper Place in High Traffic location 28oz LYTE & 1L SW Shipper 5 cases 28oz Peach Mango LYTE & 4 cases 1L SportWater EDV: 28oz SD $3.29 or 2/$5 & 1L SportWater $2.99 or 2/$5 (1/1-12/31) Shippers on TAG"
 