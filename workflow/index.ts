// import { OpenAI } from "@llamaindex/openai";
import {
  StartEvent,
  StopEvent,
  WorkflowEvent,
  SummaryIndex,
  HandlerContext,
} from "llamaindex";
import { Workflow } from "@llamaindex/workflow";
import axios from "axios";
import { Ollama } from "@llamaindex/ollama";
import ollama from 'ollama'
import { Settings } from "llamaindex";
import imageContext from './contexts/imageContext'
// import scryfallGuide from "./scryfallcontext";
// import buildcardReferenceAgentContext from './agentContexts/cardReferenceAgent'
// import scryfallQueryAgentContext from "./agentContexts/scryfallQueryAgent";
// import strategyAgentContext from "./agentContexts/strategyAgent";
// import synthesisAgentContext from "./agentContexts/synthesisAgent";
// import strategyToScryfalAgentContext from "./agentContexts/strategyToScryfalAgent";
// const ollama = new Ollama({ model: "llama2" });

// Use Ollama LLM and Embed Model
// Settings.llm = ollama;
// Settings.embedModel = ollama;

// export async function fetchScryfallCards(query: string): Promise<any> {
//   const baseUrl = 'https://api.scryfall.com/cards/search';

//   try {
//     const response = await axios.get(baseUrl, {
//       params: { q: query },
//     });

//     if(response.status > 204) {
//       console.log('No cards found for', query)
//       return null
//     }
//     return response.data.data.map(mapCard)

//   } catch (error: any) {
//     console.error('Error fetching from Scryfall for query,', query, error.response?.data || error.message);
//     return null
//   }
// }

// Create LLM instance
// const llm = new OpenAI({
//   model: 'chatgpt-4o-latest'
// });
const llm = new Ollama({
  model: "research-phi3",
});
// Create a custom event type
export class GenerateExecutionDetailsEvent extends WorkflowEvent<{
  picosData: string;
  context?: any;
}> {}

export class ImageEvent extends WorkflowEvent<{ images: string[], originalPrompt: string, context: any }> {}
export class ExecutionDetailsEvent extends WorkflowEvent<{ record: any, imageSummary: string, originalPrompt: string, context: any }> {}
// export class CardReferenceScryfallResults extends WorkflowEvent<{ results: any[], originalPrompt: string, context: any }> {}
// export class ScryfallResults extends WorkflowEvent<{ results: any[], originalPrompt: string, context: any }> {}
// export class DistillPromptIntoStrategiesEvent extends WorkflowEvent<{ result: string, originalPrompt: string, context: any }> {}
// export class StrategyEvent extends WorkflowEvent<{ result: string, originalPrompt: string, context: any }> {}

export class MessageEvent extends WorkflowEvent<{ msg: string }> {}

export function jsonToPlainText(obj: Record<string, unknown>): string {
  return Object.entries(obj)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join('\n');
}

const generateExecutionDetails = async (
  _: HandlerContext,
  ev: ExecutionDetailsEvent
) => {
  const {record, imageSummary} = ev.data

  const prompt = `You are trying to create simple instructions for people setting up product displays in stores. The instructions need to be extremely simple and no more than 100 words long. You will use provided data in Key Value Pairs and a description of execution images to generate these instructions.
 
A good instruction set includes the price, product type, package type, number of stores included, relevant discount and other relevant information.
 
A good example of instructions would be: "Freezer Sidecap Display. 1,328 stores. Product: SmartWater 700ml Sport Cap. Please fill display completely. Promotion: SmartWater Save 15%"
 
Another example would be: "Powerade 12oz 8pack $4.88 (20% Margin). Action Alley, Grocery Cart Rail, or Grocery End Cap. Display in 100% of stores. Use March Madness POS on displays. Include all 4 SKUs on Displays"
  
Respond ONLY with the instructions and no other explanation or text. Do not quote your response.

Key Value data:
${jsonToPlainText(record)}

Description of images:
${imageSummary}
`
console.log(prompt)
    const response = await llm.complete({ prompt });
    return new StopEvent(response.text);
  };

  // const analyzeImage = async (_: HandlerContext, ev: ImageEvent) => {
  const analyzeImage = async (_: HandlerContext, ev: StartEvent<any>) => {
    const { record, images } = ev.data
    const res = await ollama.chat({
    model: 'qwen2.5vl',
    messages: [{
      role: 'user',
      content: 'Summarize this image:',//imageContext(),
      images
      }]
    })
    console.log('image res', res)
  // const prompt = scryfallQueryAgentContext(ev.data.cardReferences, scryfallGuide)
  // const response = await llm.complete({ prompt });
  // _.sendEvent(new MessageEvent({ msg: `I'll look using this query: ${response.text}` }));
    return new ExecutionDetailsEvent({
      imageSummary: res.message.content,
      record,
      originalPrompt: '',
      context: {}
    });
  };

// const getCardReferenceScryfallData = async (_: HandlerContext, ev: CardReferenceQueryEvent) => {
//   const queries = ev.data.queries.split('\n')
//   const promises = queries.map(q => {
//     return fetchScryfallCards(q)
//   })
//   const results = await Promise.all(promises)
//   const flat = results.flat(Infinity)
//   _.sendEvent(new MessageEvent({ msg: `Here are the cards you're talking about: ${serializeCardData(flat)}` }));
//   return new CardReferenceScryfallResults({originalPrompt: ev.data.originalPrompt, results: flat, context: {
//     cardReferenceData: flat,
//     ...ev.data.context
//   }});
// }

// const getScryfallData = async (_: unknown, ev: QueryEvent) => {
//   const queries = ev.data.queries.split('\n')
//   const promises = queries.map(q => {
//     return fetchScryfallCards(q)
//   })
//   const results = await Promise.all(promises)
//   const flat = results.flat(Infinity)
//   return new ScryfallResults({originalPrompt: ev.data.originalPrompt, results: flat, context: ev.data.context });
// }

// const strategyAgent = async (_: HandlerContext, ev: ScryfallResults) => {
//   _.sendEvent(new MessageEvent({ msg: `OK - I'm coming up with a strategy..` }));
//   const prompt = strategyAgentContext(ev.data.originalPrompt, ev.data.results)
//   const response = await llm.complete({ prompt });
//   return new StrategyEvent({ originalPrompt: ev.data.originalPrompt, result: response.text, context: {
//     cardReferences: ev.data.results,
//     ...ev.data.context
//   }});
// }

// const strategyToQueryAgent = async (_: unknown, ev: StrategyEvent) => {
//   const prompt = strategyToScryfalAgentContext(ev.data.result, scryfallGuide)
//   const response = await llm.complete({ prompt });
//   // console.log(response.text)
//   // process.exit()
//   return new QueryEvent({ originalPrompt: ev.data.originalPrompt, queries: response.text, context: {
//     ...ev.data.context
//   }});
// }

// const synthesizeReponse = async (_: unknown, ev: ScryfallResults) => {
//   const topCards = ev.data.results.splice(0,20)
//   const prompt = synthesisAgentContext(
//     ev.data.originalPrompt,
//     serializeCardData(ev.data.context.cardReferenceData),
//     serializeCardData(topCards)
//   )

//   const response = await llm.complete({ prompt });

//   return new StopEvent(response.text);
// };

const workfow = new Workflow<unknown, string, string>({
  verbose: true,
});

workfow.addStep({ inputs: [StartEvent], outputs: [ExecutionDetailsEvent] }, analyzeImage);
workfow.addStep({ inputs: [ExecutionDetailsEvent], outputs: [StopEvent] }, generateExecutionDetails);

// workfow.addStep({ inputs: [CardReferenceEvent], outputs: [CardReferenceQueryEvent]}, generateCardReferenceScryfallQueries,);
// workfow.addStep({ inputs: [CardReferenceQueryEvent], outputs: [CardReferenceScryfallResults]}, getCardReferenceScryfallData)
// workfow.addStep({ inputs: [CardReferenceScryfallResults], outputs: [StrategyEvent]}, strategyAgent)
// workfow.addStep({ inputs: [StrategyEvent], outputs: [QueryEvent]}, strategyToQueryAgent)
// workfow.addStep({ inputs: [QueryEvent], outputs: [ScryfallResults]}, getScryfallData)
// workfow.addStep({ inputs: [ScryfallResults], outputs: [StopEvent]}, synthesizeReponse,);

// Usage
export async function runWorkflow(prompt: string) {
  const result = await workfow.run(prompt);
  return result;
}

export async function* runGenExecutionDetailsWorkflowStream(prompt: string) {
  const run = workfow.run(prompt);
  for await (const event of run) {
    if (event instanceof MessageEvent) {
      console.log("Message:");
      console.log((event as MessageEvent).data.msg);
      yield { data: (event as MessageEvent).data.msg };
    } else if (event instanceof GenerateExecutionDetailsEvent) {
      
    } else if (event instanceof StopEvent) {
      yield event;
      return;
    }
  }
}
