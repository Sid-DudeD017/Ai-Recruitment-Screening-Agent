import { aiClient } from '../src/infrastructure/ai/ai-client';
import * as fs from 'fs';

async function test() {
  console.log("Testing AI client connection...");
  try {
    const res = await aiClient.analyzeJob({
      title: "Software Engineer",
      description: "Build cool things",
      requirements: "Python, React"
    });
    console.log("Success:", res);
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}

test();
