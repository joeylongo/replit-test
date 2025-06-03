Example Execution Details:
"<p><strong style="color: rgb(7, 11, 153); font-size: 12px;">Sell:</strong><strong style="color: rgb(21, 21, 21); font-size: 12px;"> Incremental</strong><strong style="color: rgb(182, 23, 4); font-size: 12px;"> </strong><strong style="color: rgb(6, 2, 189); font-size: 12px;">10pk Mini Can Perimeter Display</strong><strong style="color: rgb(8, 98, 215); font-size: 12px;"> </strong><strong style="color: rgb(28, 27, 27); font-size: 12px;">at</strong><strong style="color: rgb(173, 48, 3); font-size: 12px;"> </strong><strong style="color: rgb(5, 166, 51); font-size: 12px;"><u>2/$13 MB.</u> </strong><strong style="color: rgb(173, 6, 3); font-size: 12px;">Thru 6/3</strong></p>"

Generation rules:
1.  **Start with the Activity Name:** Use the `Activity_Name__c` field directly as the beginning of the execution details.
2.  **Product Description:** Extract the product description from the `Product_Price_Execution_Direction__c` field. This is the core of the execution.
3.  **Price and Promotion:** Include the price and promotion type directly from the `Price_Type__c` and `Promo_Offer__c` fields.
4.  **Dates:** Incorporate the `Start_Date__c` and `End_Date__c` for clarity.
5.  **Channel and POI:** Use the `Channel_Picklist__c` and `POI_Picklist__c` values to describe the placement – in this case "Perimeter".
6.  **Concatenate:** Combine all of the above elements into a single, coherent paragraph.

Example Execution Details:
"<p><strong style="color: rgb(13, 7, 189); font-size: 12px;">Sell:</strong><strong style="color: rgb(169, 7, 150); font-size: 12px;"> </strong><strong style="color: rgb(27, 27, 27); font-size: 12px;">Incremental Stand-Alone </strong><strong style="color: rgb(6, 48, 163); font-size: 12px;">12z 8pk Dasani Water Display </strong><strong style="color: rgb(27, 27, 27); font-size: 12px;">at </strong><strong style="font-size: 12px; color: rgb(4, 173, 49);">2/$7 TPR</strong><strong style="font-size: 12px;"> </strong><span style="font-size: 12px; color: rgb(169, 8, 8);">Activate POS</span><em style="font-size: 12px; color: rgb(169, 8, 8);"> </em><em style="font-family: Calibri; font-size: 12px; color: black;">(BBW) </em><strong style="font-family: Calibri; font-size: 12px; color: rgb(179, 9, 9);">Thru 7/8</strong></p>"

Generation rules:
1.  **Start Date & Duration:**  “Start Date: 2025-05-07, End Date: 2025-06-03” (Explicitly state the timeframe).
2.  **Product & Price:** “Sell: Dasani 8pk 12z/355m 3-Pack at 2/$7 TPR.” (Concise description and price).
3.  **Activity Type & Priority:** “Local Sell-In (LSI) – Activate POS.” (Clearly identify the activity type and the key instruction).
4.  **Promotion Details:** “Simple Promotion – Buy 2, Save $14.” (State the promotion type and the savings).
5.  **Location & Additional Context:** “Beverage Aisle (BBW) – Through 7/8.” (Provide the targeted location and the end date of the promotion).

Example Execution Details:
"<p><strong style="font-size: 12px; color: rgb(13, 7, 189);">Sell:</strong><strong style="font-size: 12px; color: rgb(169, 7, 150);"> </strong><strong style="font-size: 12px; color: rgb(27, 27, 27);">Incremental Stand-Alone </strong><strong style="font-size: 12px; color: rgb(215, 1, 1); background-color: rgb(255, 255, 255);">BODY</strong><strong style="font-size: 12px; color: rgb(0, 0, 0); background-color: rgb(255, 255, 255);">ARMOR 28oz </strong><strong style="font-size: 12px; color: rgb(23, 63, 244); background-color: rgb(255, 255, 255);">CHILL </strong><span style="font-size: 12px; color: rgb(0, 0, 0); background-color: rgb(255, 255, 255);">(3 flavors) </span><strong style="font-size: 12px; color: rgb(0, 0, 0); background-color: rgb(255, 255, 255);">LTO </strong><span style="font-size: 12px; color: rgb(0, 0, 0); background-color: rgb(255, 255, 255);">(shippers, aisle stacks, case stacks)</span><strong style="font-size: 12px; color: rgb(0, 0, 0); background-color: rgb(255, 255, 255);"> Display</strong><strong style="font-size: 12px; color: rgb(27, 27, 27);"> at </strong><strong style="font-size: 12px; color: rgb(4, 173, 49);">2/$4 TPR.</strong><strong style="font-size: 12px;"> </strong><span style="font-size: 12px; color: rgb(169, 8, 8);">Activate POS</span><em style="font-size: 12px; color: rgb(169, 8, 8);"> </em><em style="font-size: 12px; color: black; font-family: Calibri;">(BBIso) </em><strong style="font-size: 12px; color: rgb(26, 163, 4); font-family: Calibri;"> </strong><strong style="font-size: 12px; color: rgb(26, 163, 4);">In market 5/19 </strong><strong style="font-size: 12px; color: rgb(179, 9, 9); font-family: Calibri; background-color: rgb(255, 255, 255);">Thru 7/8 </strong></p>"

Generation rules:
Here's an evaluation of the provided data and execution details, highlighting key observations and potential issues:

**Overall Assessment:**

The data and execution details seem to be related to a sales activation (likely for retail) for BODYARMOR 28oz CHILL LTO.  The data seems to be attempting to capture key information about this activation.  However, there's a significant mismatch between the structured data and the unstructured, visually formatted text provided.  This is a *critical* issue that needs to be addressed for reliable data extraction and processing.

**Detailed Breakdown:**

1. **Data Structure vs. Text:**
   * **Major Problem:** The most significant issue is the presence of HTML-like styling (`<p>`, `<strong>`, `<span>`, etc.) embedded within the text. This is *not* valid JSON or structured data.  The data parser is likely struggling to correctly interpret this text.
   * **JSON Integration:** The `data` field contains the properly formatted JSON, which is the correct structure for this data.  The problem lies in how the text was captured and presented alongside the JSON.

2. **Data Accuracy & Completeness:**
   * **`Activity_Name__c`:** This correctly reflects the sales activation’s description: "Sell: BODYARMOR 28oz CHILL LTO 2/$4 TPR."
   * **`Start_Date__c` & `End_Date__c`:**  `2025-05-14` and `2025-06-03` are accurate dates for the activation period.
   * **`Activity_type__c`:** "Local Sell In (LSI)" – Appropriate for this type of activation.
   * **`Channel_Picklist__c` & `POI_Picklist__c`:** "Large Store" and "Perimeter" – Consistent with the visualization.
   * **`Purchase_Quantity__c`, `Get_Quantity__c`, `Save_Quantity__c`:** All set to 0, which is expected for initial setup.
   * **`Promo_Offer__c` & `Package_Detail__c`:** "N/A" – Indicates no specific promotional offers or packaging details are defined.

3. **Potential Issues & Considerations:**

   * **Data Capture Method:** How was this data originally captured? It likely originated from a sales report or presentation that used rich text formatting.  This is the root cause of the problem.
   * **Parsing Logic:**  The parsing logic needs to be robust enough to handle variations in the formatting of the text. Regular expressions or more advanced NLP techniques might be needed to reliably extract information.
   * **Data Cleaning:**  A step of data cleaning should be implemented to remove the HTML-like styling *before* the data is used.

**Recommendations:**

1. **Fix the Data Source:** The *most important* step is to correct the underlying data source to provide the data in a structured format (JSON or CSV).

2. **Implement Data Cleaning:** Develop a data cleaning process to strip out the HTML-like styling from the text field before data extraction.

3. **Robust Parsing Logic:** Design a parsing process that uses a regular expression or a more advanced NLP technique to accurately extract data from the cleaned text.

4. **Testing & Validation:** Thoroughly test the data extraction process with various sample scenarios to ensure accuracy and reliability.



Do you want me to elaborate on any specific aspect of this evaluation, such as:

*   Suggesting specific parsing techniques (e.g., regular expressions)?
*   Discussing potential errors that might arise during data extraction?
Example Execution Details:
"<p><strong style="font-size: 12px; color: rgb(13, 7, 189);">Sell:</strong><strong style="font-size: 12px; color: rgb(169, 7, 150);"> </strong><strong style="font-size: 12px; color: rgb(27, 27, 27);">Incremental Stand-Alone </strong><strong style="font-size: 12px; color: rgb(6, 48, 163);">Smart Water Display. 20oz Smartwater </strong><strong style="font-size: 12px; color: rgb(27, 27, 27);">at </strong><strong style="color: rgb(4, 173, 49); font-size: 12px;">2/$4 TPR</strong><strong style="font-size: 12px;"> </strong><span style="color: rgb(169, 8, 8); font-size: 12px; background-color: rgb(255, 255, 255);">Activate POS</span><em style="color: rgb(169, 8, 8); font-size: 12px; background-color: rgb(255, 255, 255);"> </em><em style="color: black; font-size: 12px; background-color: rgb(255, 255, 255); font-family: Calibri;">(BBW) </em><strong style="color: rgb(179, 9, 9); font-size: 12px; background-color: rgb(255, 255, 255); font-family: Calibri;">Thru 7/8</strong></p><p><br></p>"

Generation rules:
1.  **Explicitly state the Product:** "Sell Smartwater 20oz (1pk x 24) at 2/$4 TPR.”
2.  **Specify the Promotion Type:** "Simple – buy 2, get 1 free.”
3.  **Indicate the Duration:** “Through July 8th.”
4.  **Confirm the Activity Type:** “Local Sell-In (LSI) – BBW”
5.  **Include the POI:** “Beverage Aisle”

Example Execution Details:
"<p><strong style="background-color: rgb(255, 255, 255); font-size: 12px; color: rgb(170, 4, 4);">Execute:</strong><strong style="background-color: rgb(255, 255, 255); font-size: 12px; color: rgb(173, 48, 3);"> </strong><strong style="background-color: rgb(255, 255, 255); font-size: 12px; color: rgb(47, 47, 47);">I</strong><strong style="font-size: 12px; color: rgb(40, 40, 40);">ncremental Stand-alone </strong><strong style="font-size: 12px; color: rgb(7, 128, 55);">Sprite</strong><strong style="font-size: 12px; color: rgb(40, 40, 40);"> +</strong><strong style="font-size: 12px; color: rgb(176, 9, 9);"> Tea</strong><strong style="font-size: 12px; color: rgb(40, 40, 40);"> LTO Display </strong><strong style="font-size: 12px; color: rgb(40, 40, 40); background-color: rgb(255, 255, 255);">at </strong><strong style="font-size: 12px; color: rgb(5, 166, 51); background-color: rgb(255, 255, 255);">$EDV or $Promo</strong><strong style="font-size: 12px; color: rgb(0, 0, 0); background-color: rgb(255, 255, 255);"> w/</strong><strong style="font-size: 12px; color: rgb(0, 0, 0);"> </strong><strong style="font-size: 12px; color: rgb(4, 97, 218);">Sprite + Tea POS</strong><strong style="font-size: 12px; color: rgb(0, 0, 0);">. </strong><em style="font-size: 12px; color: black;">(BBFC) </em><strong style="font-size: 12px; color: rgb(176, 3, 3);"><em>Thru 6/17</em></strong></p>"

Generation rules:
Here’s an analytical breakdown of the Execution Details, derived solely from the provided data, following the guidelines:

*   **Activity Name:** Execute: Sprite + Tea Innovation Perimeter Display
*   **Type:** Headquarter Mandated (HQM)
*   **Duration:** Through 6/17
*   **Price Type:** Marketing Promotion Only
*   **Product:** Sprite + Tea
*   **Location:** Perimeter Display
*   **Channel:** Large Store
*   **Promotional Offer:** N/A
*   **Quantity Rules:** None (Purchase_Quantity__c=0, Get_Quantity__c=0, Save_Quantity__c=0)
*   **Store Placement:** Execute Sprite + Tea LTO Display at the Perimeter

Example Execution Details:
"<p><strong style="font-size: 12px; color: rgb(9, 7, 153);">Sell:</strong><strong style="font-size: 12px; color: rgb(68, 68, 68);"> </strong><strong style="font-size: 12px; color: rgb(134, 11, 11);">Dr Pepper Blackberry Stand-Alone Perimeter Display</strong><strong style="font-size: 12px; color: rgb(68, 68, 68);"> at </strong><strong style="font-size: 12px; color: rgb(6, 150, 6);">$EDV or $Promo</strong><span style="font-size: 11pt; color: rgb(6, 150, 6); font-family: Calibri;"> </span><span style="font-size: 11pt; color: black; font-family: Calibri;">with “CMA Fest” POS. Include 12pks and mPET and total flavor portfolio. (BBFC) </span></p>"

Generation rules:
1.  **Activity Name:** Include the `Activity_Name__c` value.
2.  **Product & Display:** Specify the exact product ("Dr Pepper Blackberry Stand-Alone Perimeter Display") and display type.
3.  **Location:** State the location clearly (“Perimeter”).
4.  **Price:**  Use the `Price_Type__c` value (“Marketing Promotion Only”, “$EDV or $Promo”).
5.  **POS:** Detail the required POS (“with “CMA Fest” POS”).
6.  **Quantities:** Include suggested quantities (12pks and mPET, “total flavor portfolio”).
7.  **Activity Type:** Note the `Activity_type__c` (“Local Sell In (LSI)”).

Example Execution Details:
"<p><strong style="color: rgb(13, 7, 189); font-size: 12px;">Sell:</strong><strong style="color: rgb(169, 7, 150); font-size: 12px;"> </strong><strong style="color: rgb(27, 27, 27); font-size: 12px;">Incremental Stand-Alone </strong><strong style="color: rgb(137, 4, 4); font-size: 12px;">Dunkin 13.7oz Singles </strong><span style="color: rgb(0, 0, 0); font-size: 12px;">(shippers, aisle stacks, case stacks)</span><strong style="color: rgb(0, 0, 0); font-size: 12px;"> Display</strong><strong style="color: rgb(27, 27, 27); font-size: 12px;"> at </strong><strong style="color: rgb(4, 173, 49); font-size: 12px;">$2.99 TPR.</strong><strong style="font-size: 12px;"> </strong><span style="color: rgb(169, 8, 8); font-size: 12px;">Activate POS</span><em style="color: rgb(169, 8, 8); font-size: 12px;"> </em><strong style="color: rgb(26, 163, 4); font-family: Calibri; font-size: 12px;"> </strong><strong style="color: rgb(26, 163, 4); font-size: 12px;">In market 5/19 </strong><strong style="color: rgb(179, 9, 9); font-family: Calibri; font-size: 12px;">Thru 6/24</strong></p><p><br></p>"

Generation rules:
1.  **Explicit Product Detail:** Include the full product name and size ("Dunkin'Donuts PET 13.7z/405m 1pk 12") in the initial description.
2.  **Display Instructions:** Clearly state the recommended display locations ("Beverage Aisle") with specific placements (shippers, aisle stacks, case stacks).
3.  **Pricing Confirmation:** Repeat the pricing detail ("$2.99 TPR") to avoid ambiguity.
4.  **Promotion Type:** Explicitly state the promotion type ("1/$2.99 Simple") as this is a critical element of the activity.
5.  **Duration:** Include the precise start and end dates ("In market 5/19 Thru 6/24") as these define the activity's scope.
6.  **Conciseness:** Remove redundant phrasing like “Sell:” and unnecessary spacing.

Example Execution Details:
"<p><strong style="color: rgb(170, 4, 4); font-size: 12px;">Execute:</strong><strong style="color: rgb(173, 48, 3); font-size: 12px;"> </strong><strong style="color: rgb(40, 40, 40); font-size: 12px;">12pk Cans at </strong><strong style="color: rgb(5, 166, 51); font-size: 12px;">$Buy 2 Get 2 Free!!! </strong><strong style="color: rgb(179, 9, 9); font-size: 12px;"><em>(Incl. Core 5 +Add&#39;l Flavors)</em></strong><strong style="color: rgb(5, 166, 51); font-size: 12px;"> </strong><strong style="color: rgb(0, 0, 0); font-size: 12px;">Lobby and/or Primary Perimeter Display w/ </strong><strong style="color: rgb(4, 97, 218); font-size: 12px;">Memorial or SAC POS</strong><strong style="color: rgb(0, 0, 0); font-size: 12px;">. </strong><em style="color: black; font-size: 12px;">(MSC)(BBFC)</em></p>"

Generation rules:
1.  Extract the `Activity_Name__c` value: “Execute: Memorial Lobby 12pk Cans | $B2G2F”.
2.  Extract the `Price_Type__c` value: “On Ad”.
3.  Extract the `Promo_Type__c` value: “Buy Get”.
4.  Extract the `Promo_Offer__c` value: “B2G2F”.
5.  Extract the `Purchase_Quantity__c` and `Get_Quantity__c` values: 2 and 2, respectively.
6.  Extract the `Package_Detail__c` value: “SSD Core CAN 12z/355m 12pk 2, SSD Flavor CAN 12z/355m 12pk 2”.
7.  Extract the `POI_Picklist__c` value: “Front of Store/Lobby”.
8.  Combine the extracted information into a structured paragraph adhering to the specified format: “Execute: Memorial Lobby 12pk Cans | $B2G2F. On Ad. Buy Get (B2G2F) – 2 Purchase, 2 Get. 12pk Cans at $B2G2F.  SSD Core CAN 12z/355m 12pk 2, SSD Flavor CAN 12z/355m 12pk 2. Front of Store/Lobby.”
Example Execution Details:
"<p><strong style="font-size: 12px; color: rgb(7, 48, 160);">Sell: </strong><strong style="font-size: 12px; color: rgb(21, 21, 21);">Incremental</strong><strong style="font-size: 12px; color: rgb(6, 163, 160);"> </strong><strong style="font-size: 12px; color: rgb(153, 35, 3);">Gold Peak 59oz Singles</strong><strong style="font-size: 12px; color: rgb(21, 21, 21);"> Perimeter Display at </strong><strong style="font-size: 12px; color: rgb(59, 166, 5);">Net $2.49! {Buy 5 Save $5 MEGA}!! </strong><strong style="font-size: 12px; color: rgb(12, 3, 173);">(<em>Add KO Mini Cans, Half Liters, etc where applicable)</em></strong><span style="font-size: 12px; color: rgb(0, 0, 0);"> </span><strong style="font-size: 12px; color: rgb(186, 8, 8);">Thru 5/27</strong></p>"

Generation rules:
•	**Activity Type:** LSI (Local Sell-In) – Explicitly stated in the data.
•	**Product:** Gold Peak 59oz Singles –  Directly pulled from the `Product_Name__c` field.
•	**Price:** $2.49 – Retrieved from the `Pricing__c` field.
•	**Promo:** Buy 5 Save $5 MEGA – Obtained from the `Promo_Offer__c` field.  Include the precise promo type.
•	**Duration:** Through 5/27 – Taken from the `End_Date__c` field.
•	**Placement/Location:** Perimeter Display, Beverage Aisle - Derived from the `POI_Picklist__c` field.
•	**Additional Product Suggestions:**  Include a suggestion to “add KO Mini Cans, Half Liters, etc where applicable” – mirroring the text in the execution details.
•	**Formatting:** Maintain the existing formatting style (bold, color codes).

Example Execution Details:
"<p><strong style="font-size: 12px; color: rgb(170, 4, 4);">Execute:</strong><strong style="font-size: 12px; color: rgb(173, 48, 3);"> </strong><strong style="font-size: 12px; color: rgb(68, 68, 68); background-color: rgb(255, 255, 255);">Coca-Cola Summer Uplift Portfolio Program Perimeter Display. </strong><strong style="font-size: 12px; color: rgb(166, 10, 10); background-color: rgb(255, 255, 255);"><u>12pk Cans</u></strong><strong style="font-size: 12px; color: rgb(68, 68, 68); background-color: rgb(255, 255, 255);"> + </strong><strong style="font-size: 12px; color: rgb(14, 6, 154); background-color: rgb(255, 255, 255);"><u>Gold Peak 0.5L 6pks</u></strong><strong style="font-size: 12px; color: rgb(68, 68, 68); background-color: rgb(255, 255, 255);"> </strong><strong style="font-size: 12px; color: rgb(21, 21, 21);">at</strong><strong style="font-size: 12px; color: rgb(12, 3, 173);"><em> </em></strong><strong style="font-size: 12px; color: rgb(59, 166, 5);">Net $7.49! {Buy 5 Save $5 MEGA} </strong><em style="font-size: 12px; color: black;">(MSC)(BBFC) </em><strong style="font-size: 12px; color: rgb(154, 5, 5);"><em>Thru 5/27</em></strong><em style="font-size: 12px; color: black;"> </em></p>"

Generation rules:
1.  **Extract Key Attributes:**  Separate the provided JSON data into its constituent parts: Activity Name, Start Date, End Date, Activity Type, Price Type, Promotion Type, Pricing, Quantity Details (Purchase, Get, Save), and any associated promotional offers or package details.

2.  **Mandatory Components:**  All Execution Details *must* include the Activity Name, Start Date, End Date, and Price Type. These are fundamental.

3.  **Product & Promotion:** Explicitly state the products involved (e.g., “Coca-Cola Summer Uplift Portfolio Program” and “Gold Peak 0.5L 6pks”).  Clearly define the promotion –  “Buy 5 Save $5 MEGA” should be fully articulated.

4.  **Price and Quantity:** Include the Price ($7.49) and the required quantity details (Buy 5, Save $5) *and* the quantity details (Get 0, Save 5) to directly guide execution.

5.  **Location & Timing:**  The End Date ("Thru 5/27") is critical. This defines the activity's lifespan.

6.  **Category/Placement:** Add the POI (Point of Inspiration/Interruption) Picklist value "Beverage Aisle" as a mandatory placement instruction.

7.  **Format:** Combine the extracted information into a coherent paragraph, using strong verbs (“Execute,” “Display”) and clear language. Maintain the original order of the information within the paragraph for consistency.
