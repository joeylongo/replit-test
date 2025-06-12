
export default (options: any) => {
  const {
    promptConfig,
    recordData,
    field,
    executionDetails,
    recordContext
  } = options
  const fieldHasOptions = promptConfig.options?.length;
  const currentValue = recordData[field.key];
  const hasCurrentValue =
    currentValue &&
    currentValue.toString().trim() !== "" &&
    currentValue.toString().trim() !== "undefined" &&
    currentValue.toString().trim() !== "null";
  return `You are a Coca-Cola analyst assistant. Analyze the following Execution Details to ${
    hasCurrentValue && promptConfig.improvementStyle === "literal"
      ? `detect LITERAL contradictions for`
      : `suggest an improved value for`
  } the "${field.key}" field.

Execution Details:
${executionDetails}

Full Salesforce Record:
${recordContext}

${
  hasCurrentValue
    ? `Current field value: "${currentValue}"`
    : `The "${field.key}" field is currently empty.`
}

${
  fieldHasOptions
    ? `The ${
        field.key
      } enforces the following options: ${promptConfig.options?.join(", ")}.
Only suggest one of the available options. In your reasoning, take into consideration the fact that the value MUST be one of these options.`
    : `The ${field.key} does not enforce a list of options.`
}

${
  hasCurrentValue && promptConfig.improvementStyle === "literal"
    ? `
IMPORTANT: For populated fields, treat the EXECUTION DETAILS as the source of truth. Only flag as a discrepancy if the execution details contain specific information that contradicts the current field value.

The execution details are always correct - update the record field to match the execution details when there's a conflict.

Examples of TRUE discrepancies (field should be updated to match execution details):
- The POI_Picklist__c (Point of Interest) field shows "Beverage Aisle" but execution details say "Perimeter Display" → Update field to "Beverage Aisle"
- The Activity_type__c (Activity Type) field shows "Execute" but execution details say "Sell: ..." → Update field to "Sell"

NOT discrepancies:
- Different levels of detail (e.g., "Front of store/Lobby" vs "Front of store")
- More or less verbose wording (e.g., Execution details say "10pk Mini Can Perimeter Display" but the POI_Picklist__c field shows "Perimeter" → there is NO discrepancy since Perimeter is one of the enforced options. )
- Execution details don't mention specific conflicting information
- Field empty and execution details provide info (that's missing data, not a discrepancy)

Only suggest updating the field value if the execution details explicitly contradict it with specific information. Always suggest the value from execution details as the correct one.
`
    : `
For this field, instead of being literal in your comparison, analyze the execution details to suggest an improved value.
If the value is already satisfactory and is not empty, don't provide any suggestion and set "hasSuggest": false.
`
}

${promptConfig.customPrompt}

Respond with JSON in this exact format:
{
  "hasSuggestion": boolean,
  "suggestedValue": "string value or null",
  "confidence": number (0-100),
  "reasoning": "brief explanation of why you're suggesting this value or correction",
  "isDiscrepancy": boolean (true ONLY if there's a direct contradiction, false otherwise)
}

${
  hasCurrentValue && promptConfig.improvementStyle === "literal"
    ? `Be very conservative - if in doubt, do not flag as discrepancy. Only flag TRUE contradictions.`
    : `Only suggest a suggestedValue if confidence is above 60 and your suggestion is clearly better given info specifically mentioned in execution details.`
}
`;
};
