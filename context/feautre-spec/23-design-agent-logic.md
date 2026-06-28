Implement the full AI design agent so a user prompt results in real-time updates on the collaborative canvas, with visible AI presence and status.a

## Implementation

1. Update the design agent task in `trigger/design-agent.ts`.

   Before implementing:
   - check `context/project-overview.md` and `context/architecture-context.md` for product behavior and system rules
     -Before implementing, check Liveblocks and Trigger.dev agent skills for current patterns on canvas mutation and background task execution.
   - follow the existing Trigger.dev setup and agent patterns already in the project
   - reuse existing Liveblocks flow and presence patterns instead of creating new ones

   Then implement:
   - use 
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: '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',
  baseURL: 'https://integrate.api.nvidia.com/v1',
})

 
async function main() {
  const completion = await openai.chat.completions.create({
    model: "deepseek-ai/deepseek-v4-pro",
    messages: [{"role":"user","content":""}],
    temperature: 1,
    top_p: 0.95,
    max_tokens: 16384,
    chat_template_kwargs: {"thinking":false},
    stream: false
  })
   
    process.stdout.write(completion.choices[0]?.message?.content || '');
  
  
}

main(); to interpret the user prompt
   - update the canvas using the existing collaborative flow utilities
   - support actions like:
     - add node
     - move node
     - resize node
     - update node data
     - delete node
     - add edge
     - delete edge

   - publish AI activity to the shared status feed so all users see progress
   - update AI presence (cursor + thinking state) while the task runs
   - push clear status messages at key steps (start, processing, complete)

   - ensure generated designs follow:
     - allowed node shapes
     - color palette
     - layout and spacing rules

   - handle errors gracefully and update status if something fails
   - clear AI presence when the task finishes

## Dependencies
   All packages are already installed.`NVIDIA_API_KEY` is already in `.env.local`.

## Scope Limits

- don’t change canvas architecture
- don’t introduce a new state system outside Liveblocks
- don’t bypass existing collaborative flow utilities

## Check When Done

- Design task updates the canvas through the existing collaborative flow.
- AI presence and status are visible to all participants.
- Status messages reflect task progress.
- Errors are handled without breaking the canvas.
- `npm run build` passes.

