"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  Image,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatBytes } from "@/lib/utils/format";
import { useLanguage } from "@/lib/i18n/context";

type UploadState =
  | "idle"
  | "uploading"
  | "extracting"
  | "analyzing"
  | "generating"
  | "completed"
  | "failed";

// Status messages are now resolved via t() inside the component

const STATUS_PROGRESS: Record<UploadState, number> = {
  idle: 0,
  uploading: 15,
  extracting: 35,
  analyzing: 65,
  generating: 85,
  completed: 100,
  failed: 0,
};

export default function UploadDropzone({ initialJobId }: { initialJobId?: string }) {
  const router = useRouter();
  const { t } = useLanguage();

  const STATUS_MESSAGES: Record<UploadState, string> = {
    idle: "",
    uploading: t("upload_status_uploading"),
    extracting: t("upload_status_extracting"),
    analyzing: t("upload_status_analyzing"),
    generating: t("upload_status_generating"),
    completed: t("upload_status_completed"),
    failed: t("upload_status_failed"),
  };
  const [state, setState] = useState<UploadState>(initialJobId ? "extracting" : "idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(initialJobId ?? null);

  const startPolling = useCallback(
    (id: string) => {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/analysis/status/${id}`);
          const data = await res.json();

          setState(data.status as UploadState);

          if (data.status === "completed" && data.reportId) {
            clearInterval(interval);
            setTimeout(() => {
              router.push(`/reports/${data.reportId}`);
            }, 1500);
          } else if (data.status === "failed") {
            clearInterval(interval);
            toast.error(
              data.errorMessage ?? "Error al procesar la analítica."
            );
          }
        } catch {
          // network error, keep polling
        }
      }, 3000);
    },
    [router]
  );

  const handleUpload = useCallback(
    async (file: File) => {
      setState("uploading");
      setSelectedFile(file);

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/analysis/create", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json();
          if (err.error === "upgrade_required") {
            setState("idle");
            setSelectedFile(null);
            toast.error(t("upload_upgrade_toast"), {
              action: {
                label: t("upload_upgrade_action"),
                onClick: () => router.push("/subscription"),
              },
              duration: 6000,
            });
            return;
          }
          throw new Error(err.error ?? "Upload failed");
        }

        const { jobId: id } = await res.json();
        setJobId(id);
        setState("extracting");
        startPolling(id);
      } catch (err) {
        setState("failed");
        toast.error(
          err instanceof Error ? err.message : "Error al subir el archivo"
        );
      }
    },
    [startPolling]
  );

  // If mounted with an initialJobId, start polling immediately
  useEffect(() => {
    if (initialJobId) startPolling(initialJobId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0 && state === "idle") {
        handleUpload(acceptedFiles[0]);
      }
    },
    accept: {
      "application/pdf": [".pdf"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxSize: 20 * 1024 * 1024,
    multiple: false,
    disabled: state !== "idle",
  });

  if (state !== "idle") {
    return (
      <div className="rounded-xl border-2 border-dashed border-muted p-12 text-center space-y-6">
        {state === "completed" ? (
          <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
        ) : state === "failed" ? (
          <XCircle className="mx-auto h-16 w-16 text-destructive" />
        ) : (
          <Loader2 className="mx-auto h-16 w-16 text-primary animate-spin" />
        )}

        <div>
          <p className="text-lg font-semibold">{STATUS_MESSAGES[state]}</p>
          {selectedFile && (
            <p className="text-sm text-muted-foreground mt-1">
              {selectedFile.name} ({formatBytes(selectedFile.size)})
            </p>
          )}
        </div>

        {state !== "failed" && state !== "completed" && (
          <div className="max-w-xs mx-auto space-y-2">
            <Progress value={STATUS_PROGRESS[state]} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {t("upload_wait")}
            </p>
          </div>
        )}

        {state === "failed" && (
          <Button onClick={() => { setState("idle"); setSelectedFile(null); setJobId(null); }}>
            {t("upload_retry")}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`rounded-xl border-2 border-dashed p-12 text-center cursor-pointer transition-colors ${
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-muted hover:border-primary/50 hover:bg-muted/30"
      }`}
    >
      <input {...getInputProps()} />

      <div className="space-y-4">
        <div className="flex justify-center gap-4">
          <div className="p-3 rounded-full bg-primary/10">
            <Upload className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div>
          <p className="text-xl font-semibold">
            {isDragActive ? t("upload_drag_active") : t("upload_drag")}
          </p>
          <p className="text-muted-foreground mt-1">{t("upload_click")}</p>
        </div>

        <div className="flex justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <FileText className="h-4 w-4" />
            <span>PDF</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Image className="h-4 w-4" />
            <span>JPG, PNG, WEBP</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">{t("upload_max")}</p>
      </div>
    </div>
  );
}
