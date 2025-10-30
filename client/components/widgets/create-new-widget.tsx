"use client";

import React, { useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Loader2, Target, MessageSquare } from "lucide-react";

type WidgetType = "GOAL" | "POLL";

type CreateWidgetPayload = {
  postId?: number | null;
  type: WidgetType;
  title: string;
  description?: string | null;
  targetValue?: number | null;
  metric?: "PASS_COUNT" | null;
  expiresAt?: string | null;
  pollOptions?: { text: string }[];
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || "/api";

function Label({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-extrabold text-black">
      {children}
    </label>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
};
const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  props,
  ref
): React.ReactElement {
  const { className, error, ...rest } = props;
  return (
    <div className="flex flex-col gap-1">
      <input
        ref={ref}
        className={[
          "w-full px-3 py-2 border-4 border-black rounded-md shadow-[4px_4px_0_0_#000]",
          "focus:outline-none focus:-translate-x-0.5 focus:-translate-y-0.5 transition-transform",
          "bg-white text-black font-bold placeholder:text-black/60",
          className || "",
        ].join(" ")}
        {...rest}
      />
      {error ? (
        <span className="text-red-600 font-extrabold text-xs">{error}</span>
      ) : null}
    </div>
  );
});
Input.displayName = "Input";

function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }
): React.ReactElement {
  const { className, error, ...rest } = props;
  return (
    <div className="flex flex-col gap-1">
      <textarea
        className={[
          "w-full min-h-28 resize-y px-3 py-2 border-4 border-black rounded-md shadow-[4px_4px_0_0_#000]",
          "focus:outline-none focus:-translate-x-0.5 focus:-translate-y-0.5 transition-transform",
          "bg-white text-black font-bold placeholder:text-black/60",
          className || "",
        ].join(" ")}
        {...rest}
      />
      {error ? (
        <span className="text-red-600 font-extrabold text-xs">{error}</span>
      ) : null}
    </div>
  );
}

async function fetchWithAuth(path: string, init: RequestInit = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

export default function CreateNewWidget({
  postId = null,
  onCreated,
  onCancel,
}: {
  postId?: number | null;
  onCreated?: (widget: unknown) => void;
  onCancel?: () => void;
}) {
  const [type, setType] = useState<WidgetType>("GOAL");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [metric, setMetric] = useState<"PASS_COUNT">("PASS_COUNT");
  const [targetValue, setTargetValue] = useState<string>("");
  const [expiresAtLocal, setExpiresAtLocal] = useState<string>("");
  const [options, setOptions] = useState<Array<{ id: string; text: string }>>([
    { id: `${Date.now()}-1`, text: "" },
    { id: `${Date.now()}-2`, text: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const optionInputRef = useRef<HTMLInputElement>(null);

  const canSubmit = useMemo(() => {
    const errors: Record<string, string> = {};

    if (!title.trim()) {
      errors.title = "Title is required";
    }

    if (type === "POLL") {
      const validOptions = options.map((o) => o.text.trim()).filter(Boolean);
      if (validOptions.length < 2) {
        errors.options = "At least 2 poll options are required";
      }
      const uniqueOptions = new Set(
        validOptions.map((opt) => opt.toLowerCase())
      );
      if (uniqueOptions.size !== validOptions.length) {
        errors.options = "Poll options must be unique";
      }
      if (targetValue && isNaN(Number(targetValue))) {
        errors.targetValue = "Target value must be a valid number";
      }
    }

    if (type === "GOAL") {
      if (!targetValue) {
        errors.targetValue = "Target value is required for goals";
      } else if (isNaN(Number(targetValue)) || Number(targetValue) <= 0) {
        errors.targetValue = "Target value must be a positive number";
      }
    }

    if (expiresAtLocal && isNaN(new Date(expiresAtLocal).getTime())) {
      errors.expiresAt = "Invalid date format";
    }

    if (expiresAtLocal && new Date(expiresAtLocal) <= new Date()) {
      errors.expiresAt = "Expiration date must be in the future";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [title, type, options, targetValue, expiresAtLocal]);

  function addOption() {
    setOptions((prev) => [
      ...prev,
      { id: `${Date.now()}-${prev.length + 1}`, text: "" },
    ]);
    setTimeout(() => optionInputRef.current?.focus(), 0);
  }

  function removeOption(id: string) {
    setOptions((prev) =>
      prev.length <= 2 ? prev : prev.filter((o) => o.id !== id)
    );
  }

  async function handleSubmit() {
    try {
      setSubmitting(true);
      setError(null);

      const payload: CreateWidgetPayload = {
        postId,
        type,
        title: title.trim(),
        description: description.trim() || null,
      };

      if (expiresAtLocal) {
        const date = new Date(expiresAtLocal);
        payload.expiresAt = isNaN(date.getTime()) ? null : date.toISOString();
      } else {
        payload.expiresAt = null;
      }

      if (type === "GOAL") {
        payload.metric = metric;
        payload.targetValue = targetValue ? Number(targetValue) : null;
      } else {
        const cleaned = options
          .map((o) => o.text.trim())
          .filter(Boolean)
          .map((text) => ({ text }));
        payload.pollOptions = cleaned;
        payload.targetValue = targetValue ? Number(targetValue) : null;
        payload.metric = null;
      }

      const res = await fetchWithAuth("/widgets", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to create widget");
      }

      const widget = await res.json();
      onCreated?.(widget);

      setTitle("");
      setDescription("");
      setMetric("PASS_COUNT");
      setTargetValue("");
      setExpiresAtLocal("");
      setOptions([
        { id: `${Date.now()}-1`, text: "" },
        { id: `${Date.now()}-2`, text: "" },
      ]);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="w-full border-4 border-black bg-white shadow-[12px_12px_0_0_#000]">
      <CardHeader className="pb-3 border-b-4 border-black bg-white">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-black">Create a Widget</CardTitle>

          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() => setType("GOAL")}
              className={`px-4 py-2 font-extrabold border-4 border-black shadow-[4px_4px_0_0_#000] hover:shadow-[6px_6px_0_0_#000] transform hover:-translate-x-1 hover:-translate-y-1 ${
                type === "GOAL"
                  ? "bg-pink-300 text-black"
                  : "bg-white text-black"
              }`}
            >
              <Target className="w-4 h-4 mr-2" /> Goal
            </Button>
            <Button
              type="button"
              onClick={() => setType("POLL")}
              className={`px-4 py-2 font-extrabold border-4 border-black shadow-[4px_4px_0_0_#000] hover:shadow-[6px_6px_0_0_#000] transform hover:-translate-x-1 hover:-translate-y-1 ${
                type === "POLL"
                  ? "bg-yellow-300 text-black"
                  : "bg-white text-black"
              }`}
            >
              <MessageSquare className="w-4 h-4 mr-2" /> Poll
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 bg-white">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Give it a catchy title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={validationErrors.title}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add more context (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="expiresAt">Expires At (optional)</Label>
            <Input
              id="expiresAt"
              type="datetime-local"
              value={expiresAtLocal}
              onChange={(e) => setExpiresAtLocal(e.target.value)}
              error={validationErrors.expiresAt}
            />
          </div>

          {type === "GOAL" && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="metric">Metric</Label>
              <select
                id="metric"
                value={metric}
                onChange={(e) => setMetric(e.target.value as "PASS_COUNT")}
                className="w-full px-3 py-2 border-4 border-black rounded-md shadow-[4px_4px_0_0_#000] bg-white text-black font-bold focus:outline-none focus:-translate-x-0.5 focus:-translate-y-0.5 transition-transform"
              >
                <option value="PASS_COUNT">Pass Count</option>
              </select>
            </div>
          )}

          {type === "POLL" && (
            <div className="flex flex-col gap-2">
              <Label>Poll Options</Label>
              {validationErrors.options && (
                <span className="text-red-600 font-extrabold text-xs">
                  {validationErrors.options}
                </span>
              )}
              <div className="flex flex-col gap-2">
                {options.map((o, idx) => (
                  <div key={o.id} className="flex items-center gap-2">
                    <Input
                      ref={
                        idx === options.length - 1 ? optionInputRef : undefined
                      }
                      placeholder={`Option ${idx + 1}`}
                      value={o.text}
                      onChange={(e) =>
                        setOptions((prev) =>
                          prev.map((p) =>
                            p.id === o.id ? { ...p, text: e.target.value } : p
                          )
                        )
                      }
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={() => removeOption(o.id)}
                      disabled={options.length <= 2}
                      className="bg-white text-black border-4 border-black shadow-[4px_4px_0_0_#000] hover:shadow-[6px_6px_0_0_#000] hover:-translate-x-1 hover:-translate-y-1"
                      aria-label="Remove option"
                      title={
                        options.length <= 2
                          ? "At least two options required"
                          : "Remove option"
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div>
                <Button
                  type="button"
                  onClick={addOption}
                  className="mt-1 inline-flex items-center gap-2 bg-white text-black border-4 border-black shadow-[4px_4px_0_0_#000] hover:shadow-[6px_6px_0_0_#000] hover:-translate-x-1 hover:-translate-y-1"
                >
                  <Plus className="w-4 h-4" /> Add option
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="targetValue">
              Target Value {type === "GOAL" ? "(required)" : "(optional)"}
            </Label>
            <Input
              id="targetValue"
              inputMode="numeric"
              placeholder={type === "GOAL" ? "e.g. 50" : "e.g. 100"}
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              error={validationErrors.targetValue}
            />
          </div>

          {error ? (
            <div className="bg-red-200 text-black border-4 border-black p-3 font-extrabold shadow-[4px_4px_0_0_#000]">
              {error}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2 pt-2">
            {onCancel && (
              <Button
                type="button"
                onClick={onCancel}
                className="bg-white text-black border-4 border-black shadow-[4px_4px_0_0_#000] hover:shadow-[6px_6px_0_0_#000] hover:-translate-x-1 hover:-translate-y-1"
              >
                Cancel
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="bg-yellow-300 text-black border-4 border-black shadow-[6px_6px_0_0_#000] hover:shadow-[8px_8px_0_0_#000] hover:-translate-x-1 hover:-translate-y-1 font-extrabold"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </span>
              ) : (
                "Create"
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
