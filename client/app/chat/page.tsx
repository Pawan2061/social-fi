// 'use client'
// import React, { useEffect, useRef, useState } from "react"

// type Msg = {
//     id: string
//     role: "user" | "assistant" | "image"
//     text?: string
//     dataUrl?: string
// }

// export default function ChatPage() {
//     const [input, setInput] = useState("")
//     const [isImage, setIsImage] = useState(false)
//     const [size, setSize] = useState<"256x256" | "512x512" | "1024x1024">("512x512")
//     const [messages, setMessages] = useState<Msg[]>([])
//     const [loading, setLoading] = useState(false)
//     const [error, setError] = useState<string | null>(null)
//     const listRef = useRef<HTMLDivElement | null>(null)

//     useEffect(() => {
//         listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" })
//     }, [messages, loading])

//     async function handleSubmit(e?: React.FormEvent) {
//         e?.preventDefault()
//         if (!input.trim()) return

//         const userMsg: Msg = { id: String(Date.now()) + "-u", role: "user", text: input }
//         setMessages((m) => [...m, userMsg])
//         setInput("")
//         setError(null)
//         setLoading(true)

//         try {
//             if (isImage) {
//                 // Image generation flow
//                 const body = {
//                     type: "image",
//                     prompt: userMsg.text,
//                     size,
//                 }
//                 const res = await fetch("/api/chat", {
//                     method: "POST",
//                     headers: { "Content-Type": "application/json" },
//                     body: JSON.stringify(body),
//                 })

//                 const data = await res.json()
//                 if (!res.ok) throw new Error(data?.error || "Image generation failed")

//                 const imageMsg: Msg = {
//                     id: String(Date.now()) + "-img",
//                     role: "image",
//                     dataUrl: data.dataUrl,
//                     text: data.prompt,
//                 }
//                 setMessages((m) => [...m, imageMsg])
//             } else {
//                 // Text generation flow (simple single-prompt)
//                 const body = {
//                     prompt: userMsg.text,
//                 }
//                 const res = await fetch("/api/chat", {
//                     method: "POST",
//                     headers: { "Content-Type": "application/json" },
//                     body: JSON.stringify(body),
//                 })

//                 const data = await res.json()
//                 if (!res.ok) throw new Error(data?.error || "Text generation failed")

//                 const assistantMsg: Msg = {
//                     id: String(Date.now()) + "-a",
//                     role: "assistant",
//                     text: data.text ?? "(no response)",
//                 }
//                 setMessages((m) => [...m, assistantMsg])
//             }
//         } catch (err: unknown) {
//             const msg = err instanceof Error ? err.message : String(err)
//             setError(msg)
//         } finally {
//             setLoading(false)
//         }
//     }

//     return (
//         <main style={{ maxWidth: 800, margin: "24px auto", padding: 16, fontFamily: "Inter, system-ui, sans-serif" }}>
//             <h1 style={{ marginBottom: 8 }}>AI Chat + Image Bot</h1>

//             <section
//                 ref={listRef}
//                 style={{
//                     border: "1px solid #e5e7eb",
//                     borderRadius: 8,
//                     padding: 12,
//                     height: 480,
//                     overflowY: "auto",
//                     background: "#fafafa",
//                 }}
//             >
//                 {messages.length === 0 && <p style={{ color: "#6b7280" }}>Send a prompt to generate text or an image.</p>}
//                 {messages.map((m) => (
//                     <div key={m.id} style={{ marginBottom: 12 }}>
//                         {m.role === "user" && (
//                             <div style={{ textAlign: "right" }}>
//                                 <div style={{ display: "inline-block", background: "#111827", color: "white", padding: "8px 12px", borderRadius: 12 }}>
//                                     {m.text}
//                                 </div>
//                             </div>
//                         )}

//                         {m.role === "assistant" && (
//                             <div style={{ textAlign: "left" }}>
//                                 <div style={{ display: "inline-block", background: "#e6f0ff", color: "#0f172a", padding: "8px 12px", borderRadius: 12 }}>
//                                     {m.text}
//                                 </div>
//                             </div>
//                         )}

//                         {m.role === "image" && (
//                             <div style={{ textAlign: "left" }}>
//                                 <div style={{ marginBottom: 6, color: "#0f172a", fontSize: 13 }}>{m.text}</div>
//                                 {m.dataUrl ? (
//                                     <img src={m.dataUrl} alt={m.text} style={{ maxWidth: "100%", borderRadius: 8, border: "1px solid #e5e7eb" }} />
//                                 ) : (
//                                     <div style={{ color: "#ef4444" }}>Image not available</div>
//                                 )}
//                             </div>
//                         )}
//                     </div>
//                 ))}
//                 {loading && <div style={{ color: "#6b7280" }}>Generating...</div>}
//             </section>

//             <form onSubmit={handleSubmit} style={{ marginTop: 12, display: "flex", gap: 8 }}>
//                 <input
//                     aria-label="Prompt"
//                     value={input}
//                     onChange={(e) => setInput(e.target.value)}
//                     placeholder={isImage ? "Describe the image to generate..." : "Ask something..."}
//                     style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db" }}
//                 />

//                 <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
//                     <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 14 }}>
//                         <input type="checkbox" checked={isImage} onChange={(e) => setIsImage(e.target.checked)} />
//                         Image
//                     </label>

//                     {isImage && (
//                         <select value={size} onChange={(e) => setSize(e.target.value as any)} style={{ padding: 8, borderRadius: 8 }}>
//                             <option value="256x256">256x256</option>
//                             <option value="512x512">512x512</option>
//                             <option value="1024x1024">1024x1024</option>
//                         </select>
//                     )}

//                     <button type="submit" disabled={loading} style={{ padding: "8px 12px", borderRadius: 8 }}>
//                         Send
//                     </button>
//                 </div>
//             </form>

//             {error && (
//                 <div style={{ marginTop: 12, color: "white", background: "#ef4444", padding: 8, borderRadius: 6 }}>
//                     {error}
//                 </div>
//             )}
//         </main>
//     )
// }