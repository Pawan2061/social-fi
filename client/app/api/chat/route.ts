import {
    consumeStream,
    convertToModelMessages,
    experimental_generateImage,
    generateText,
    streamText,
    type UIMessage,
} from "ai"

import { openai } from '@ai-sdk/openai';


export const maxDuration = 60

type ImageBody = {
    type: "image"
    prompt: string
    size?: "256x256" | "512x512" | "1024x1024"
    background?: "transparent" | "white"
}

type TextBody =
    | {
        // chat-style streaming with UI messages
        type?: "text"
        messages: UIMessage[]
        maxOutputTokens?: number
        temperature?: number
    }
    | {
        // simple single-prompt (non-stream) completion
        type?: "text"
        prompt: string
        maxOutputTokens?: number
        temperature?: number
    }

export async function POST(req: Request) {
    try {
        const contentType = req.headers.get("content-type") || ""
        if (!contentType.includes("application/json")) {
            return Response.json({ error: "Unsupported Media Type: expected application/json" }, { status: 415 })
        }

        const body = (await req.json()) as ImageBody | TextBody

        // Image generation flow
        if ("type" in body && body.type === "image") {
            if (!body.prompt || typeof body.prompt !== "string") {
                return Response.json({ error: "Missing image prompt" }, { status: 400 })
            }

            const { image } = await experimental_generateImage({
                model: openai.image('dall-e-2'),
                prompt: body.prompt,
                size: body.size ?? "1024x1024",
            })

            if (!image) {
                return Response.json({ error: "Failed to generate image" }, { status: 500 })
            }

            return Response.json({
                type: "image",
                prompt: body.prompt,
                size: body.size ?? "1024x1024",
                dataUrl: `data:${image.mediaType};base64,${image.base64}`,
            })
        }

        // Text generation flow

        if ("messages" in body && Array.isArray(body.messages)) {
            const modelMessages = convertToModelMessages(body.messages)

            const result = streamText({
                model: openai('gpt-4o'),
                messages: modelMessages,
                abortSignal: req.signal,
                maxOutputTokens: "maxOutputTokens" in body ? body.maxOutputTokens : undefined,
                temperature: "temperature" in body ? body.temperature : undefined,
            })

            return result.toUIMessageStreamResponse({
                consumeSseStream: consumeStream,
            })
        }

        // Otherwise, simple generate text from a single prompt
        if ("prompt" in body && typeof body.prompt === "string") {
            const { text } = await generateText({
                model: openai('gpt-4o'),
                prompt: body.prompt,
                maxOutputTokens: "maxOutputTokens" in body ? body.maxOutputTokens : undefined,
                temperature: "temperature" in body ? body.temperature : undefined,
            })

            return Response.json({
                type: "text",
                text,
            })
        }

        return Response.json(
            {
                error:
                    "Invalid request. Provide either { type: 'image', prompt } for image generation, or { messages } / { prompt } for text.",
            },
            { status: 400 },
        )
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown error"
        console.error('API Error:', err)
        return Response.json({ error: message }, { status: 500 })
    }
}
