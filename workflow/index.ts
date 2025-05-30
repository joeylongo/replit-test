// import { OpenAI } from "@llamaindex/openai";
import {
  StartEvent,
  StopEvent,
  WorkflowEvent,
  HandlerContext,
} from "llamaindex";
import { Workflow } from "@llamaindex/workflow";
import axios from "axios";
import ollama from 'ollama'
import imageContext from './contexts/imageContext'
import getExecutionDetailsContext from './contexts/executionDetails'
import { systemPrompt } from './contexts/systemContext'
import picosSystemPrompt from './contexts/picosSystemPrompt'

const separator = () => console.log('=========================================================')
// Create a custom event type
export class GenerateExecutionDetailsEvent extends WorkflowEvent<{
  picosData: string;
  context?: any;
}> {}

export class ImageEvent extends WorkflowEvent<{ images: string[], originalPrompt: string, context: any }> {}
export class ExecutionDetailsEvent extends WorkflowEvent<{ record: any, imageSummary: string, originalPrompt: string, context: any }> {}

export class MessageEvent extends WorkflowEvent<{ msg: string }> {}

export function jsonToPlainText(obj: Record<string, unknown>): string {
  return Object.entries(obj)
    .map(([key, value]) => value !== '' ? `${key}: ${String(value)}` : undefined)
    .join('\n');
}

export function stripThinking(markup: string): string {
  return markup
    // 1️⃣ match <think …> … </think>, case-insensitive, across newlines
    .replace(/<think\b[^>]*>[\s\S]*?<\/think>/gi, '')
    // 2️⃣ normalize leftover whitespace (optional)
    .replace(/\s+\n/g, '\n')
    .trim();
}

const CHAT_SOURCE: string = 'local'

const chat = async (systemPrompt: string, userPrompt: string, images?: string[], format?: any) => {
  if(CHAT_SOURCE === 'local') {
    const res = await ollama.chat({
      model: 'gemma3:12b',
      messages: [
        { role: 'system', content: picosSystemPrompt() },
        // { role: 'system', content: systemPrompt + '\n\n' + picosSystemPrompt() },
        { role: 'user', content: userPrompt, images }
      ],
      format
    })
    return res.message.content
  } else {
    const { data } = await axios.post('http://Adams-Mac-Studio.local:3000/chat', {
      systemPrompt,
      userPrompt,
      images
    })
    return data.result.message.content
  }
}

const generateExecutionDetails = async (
  _: HandlerContext,
  ev: ExecutionDetailsEvent
) => {
  const {record, imageSummary} = ev.data
  const keyValues = jsonToPlainText(record);
  const userPrompt = getExecutionDetailsContext(keyValues, imageSummary)

  console.log(systemPrompt);
  console.log(userPrompt);
  separator();

  const stripped = await chat(systemPrompt, userPrompt, [], {
    type: "object",
    properties: {
      discrepancies: {
        type: 'string'
      },
      executionDetails: {
        type: "string",
      },
    },
    required: ["executionDetails"],
  }); 
  console.log('stripped', stripped)
  separator();
  return new StopEvent(JSON.parse(stripped).executionDetails);
};

  // const analyzeImage = async (_: HandlerContext, ev: ImageEvent) => {
  const analyzeImage = async (_: HandlerContext, ev: StartEvent<any>) => {
    const { record, images } = ev.data
    if(images?.length) {
      _.sendEvent(new MessageEvent({ msg: `Analyzing ${images.length} provided images...` }));
      const res = await chat(imageContext(), images)
      console.log('Image Agent Response:', res)
      separator()
      return new ExecutionDetailsEvent({
        imageSummary: res,
        record,
        originalPrompt: '',
        context: {}
      });
    } else {
      return new ExecutionDetailsEvent({
        imageSummary: 'No images were provided.',
        record,
        originalPrompt: '',
        context: {}
      });
    }
  };

const workfow = new Workflow<unknown, string, string>({
  verbose: true,
});

workfow.addStep({ inputs: [StartEvent], outputs: [ExecutionDetailsEvent] }, analyzeImage);
workfow.addStep({ inputs: [ExecutionDetailsEvent], outputs: [StopEvent] }, generateExecutionDetails);

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
      yield { message: (event as MessageEvent).data.msg };
    } else if (event instanceof GenerateExecutionDetailsEvent) {
      
    } else if (event instanceof StopEvent) {
      yield event;
      return;
    }
  }
}
