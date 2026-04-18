/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Camera, CheckCircle2, ChevronLeft, ChevronRight, FileText, MapPinned, Upload, Wallet } from "lucide-react";
import { toast } from "react-toastify";
import DashboardLayout from "../components/layouts/DashboardLayout.tsx";
import useRegisterLand from "../hooks/useRegisterLand";
import "react-toastify/dist/ReactToastify.css";

type StepId = 0 | 1 | 2;
type DocumentStep = "image" | "cofo";

const steps = [
  {
    id: 0 as StepId,
    title: "Land Identity",
    description: "Capture the parcel reference and location details for the onchain record.",
    icon: <MapPinned className="h-5 w-5" />,
  },
  {
    id: 1 as StepId,
    title: "Supporting Documents",
    description: "Upload the land image and certificate documents that support this record.",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    id: 2 as StepId,
    title: "Review & Submit",
    description: "Check the record summary and approve the wallet transaction to register it.",
    icon: <Wallet className="h-5 w-5" />,
  },
];

const inputClassName =
  "w-full rounded-[0.95rem] border border-[rgba(180,140,90,0.16)] bg-[#20293b] px-4 py-2.5 text-base text-white outline-none transition placeholder:text-[rgba(255,255,255,0.38)] focus:border-primary focus:bg-[#263149] focus:ring-4 focus:ring-primary/10";

const Register = () => {
  const navigate = useNavigate();
  const handleRegisterLand = useRegisterLand();
  const [activeStep, setActiveStep] = useState<StepId>(0);
  const [documentStep, setDocumentStep] = useState<DocumentStep>("image");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageCID, setImageCID] = useState<string | null>(null);
  const [coFoCID, setCoFoCID] = useState<string | null>(null);
  const [filePrev, setFilePrev] = useState<string | null>(null);
  const [coFoFilePrev, setCoFoFilePrev] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [coFoFileName, setCoFoFileName] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [coFoMimeType, setCoFoMimeType] = useState<string | null>(null);

  const [formState, setState] = useState({
    numberOfPlots: "",
    state: "",
    lga: "",
    city: "",
    assessedValuePerPlot: 0,
    titleNumber: "",
  });

  const canAdvanceFromIdentity = useMemo(() => {
    return (
      formState.titleNumber.trim() &&
      formState.numberOfPlots.trim() &&
      formState.state.trim() &&
      formState.lga.trim() &&
      formState.city.trim() &&
      Number(formState.assessedValuePerPlot) > 0
    );
  }, [formState]);

  const canAdvanceFromDocuments = Boolean(imageCID && coFoCID);
  const progressUnits = 4;
  const currentProgressUnit =
    activeStep === 0
      ? 1
      : activeStep === 1
        ? documentStep === "image"
          ? 2
          : 3
        : 4;

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fileType: "image" | "cofo"
  ) => {
    if (!e.target.files?.[0]) return;

    setIsSubmitting(true);
    const selectedFile = e.target.files[0];

    const data = new FormData();
    data.append("name", fileType === "image" ? "land-image" : "cofo-document");
    data.append("file", selectedFile);

    const config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_PINATA_JWT}`,
      },
      data,
    };

    try {
      const response = await axios.request(config);
      const cid = response.data.IpfsHash;

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result?.toString().split(",")[1];
        if (!base64Data) return;

        if (fileType === "image") {
          setImageCID(cid);
          setFilePrev(base64Data);
          setImageFileName(selectedFile.name);
          setImageMimeType(selectedFile.type);
        } else {
          setCoFoCID(cid);
          setCoFoFilePrev(base64Data);
          setCoFoFileName(selectedFile.name);
          setCoFoMimeType(selectedFile.type);
        }
      };
      reader.readAsDataURL(selectedFile);

      toast.success(
        `${fileType === "image" ? "Land image" : "Certificate of occupancy"} uploaded successfully`
      );
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    field: string,
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = e.target.value;
    setState((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!canAdvanceFromIdentity) {
      toast.error("Complete the land identity fields before submitting.");
      return false;
    }

    if (!imageCID) {
      toast.error("Upload a land image before submitting.");
      return false;
    }

    if (!coFoCID) {
      toast.error("Upload a certificate of occupancy before submitting.");
      return false;
    }

    return true;
  };

  const goNext = () => {
    if (activeStep === 0 && !canAdvanceFromIdentity) {
      toast.error("Complete the land identity section before continuing.");
      return;
    }

    if (activeStep === 1 && !canAdvanceFromDocuments) {
      if (documentStep === "image" && !imageCID) {
        toast.error("Upload the land image before continuing.");
        return;
      }

      if (documentStep === "cofo" && !coFoCID) {
        toast.error("Upload the certificate of occupancy before continuing.");
        return;
      }
    }

    if (activeStep === 0) {
      setActiveStep(1);
      setDocumentStep("image");
      return;
    }

    if (activeStep === 1) {
      if (documentStep === "image") {
        setDocumentStep("cofo");
        return;
      }

      setActiveStep(2);
      return;
    }
  };

  const goBack = () => {
    if (activeStep === 2) {
      setActiveStep(1);
      setDocumentStep("cofo");
      return;
    }

    if (activeStep === 1) {
      if (documentStep === "cofo") {
        setDocumentStep("image");
        return;
      }

      setActiveStep(0);
      return;
    }

    setActiveStep(0);
  };

  const registerLandAndRedirect = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      await handleRegisterLand(
        Number(formState.numberOfPlots),
        formState.state,
        formState.lga,
        formState.city,
        Number(formState.assessedValuePerPlot),
        Number(formState.titleNumber),
        imageCID as string,
        coFoCID as string
      );

      toast.success("Land record registered successfully");
      setTimeout(() => {
        navigate("/dashboard");
      }, 1200);
    } catch (error: any) {
      console.error("Error registering land:", error);
      if (error.message?.includes("user rejected transaction")) {
        toast.error("Transaction was rejected in the wallet.");
      } else if (error.message?.includes("insufficient funds")) {
        toast.error("Insufficient funds in your wallet for this transaction.");
      } else {
        toast.error(`Failed to register land: ${error.message || "Unknown error"}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-5xl">
        <section className="mb-7 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Registry Workflow</p>
          <h1 className="mt-4 max-w-3xl text-[2.4rem] font-semibold leading-tight text-white">
            Register a land record in deliberate steps.
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <StepMetaPill label={`Step ${activeStep + 1} of 3`} />
            <StepMetaPill label={steps[activeStep].title} />
            <StepMetaPill label="Sale listing happens later" />
          </div>

          <div className="mt-5 max-w-2xl">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#263149]">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${(currentProgressUnit / progressUnits) * 100}%` }}
              />
            </div>
          </div>
        </section>

        <section className="max-w-4xl pb-24">
          {activeStep === 0 && (
            <StepSection>
              <div className="grid grid-cols-1 gap-4">
                <Field label="Title Number" htmlFor="titleNumber">
                  <input
                    type="text"
                    id="titleNumber"
                    value={formState.titleNumber}
                    placeholder="Enter title number"
                    onChange={(e) => handleInputChange("titleNumber", e)}
                    className={inputClassName}
                    required
                  />
                </Field>

                <Field label="Number of Plots" htmlFor="numberOfPlots">
                  <input
                    type="text"
                    id="numberOfPlots"
                    placeholder="Enter number of plots"
                    value={formState.numberOfPlots}
                    onChange={(e) => handleInputChange("numberOfPlots", e)}
                    className={inputClassName}
                    required
                  />
                </Field>

                <Field label="State" htmlFor="state">
                  <input
                    type="text"
                    id="state"
                    placeholder="Enter state"
                    value={formState.state}
                    onChange={(e) => handleInputChange("state", e)}
                    className={inputClassName}
                    required
                  />
                </Field>

                <Field label="Local Government Area" htmlFor="lga">
                  <input
                    type="text"
                    id="lga"
                    placeholder="Enter LGA"
                    value={formState.lga}
                    onChange={(e) => handleInputChange("lga", e)}
                    className={inputClassName}
                    required
                  />
                </Field>

                <Field label="City" htmlFor="city">
                  <input
                    type="text"
                    id="city"
                    placeholder="Enter city"
                    value={formState.city}
                    onChange={(e) => handleInputChange("city", e)}
                    className={inputClassName}
                    required
                  />
                </Field>

                <Field label="Assessed Value Per Plot" htmlFor="assessedValuePerPlot">
                  <input
                    type="number"
                    id="assessedValuePerPlot"
                    placeholder="Enter assessed value per plot"
                    value={formState.assessedValuePerPlot}
                    onChange={(e) => handleInputChange("assessedValuePerPlot", e)}
                    className={inputClassName}
                    min="0"
                    step="0.0001"
                    required
                  />
                </Field>
              </div>
            </StepSection>
          )}

          {activeStep === 1 && (
            <StepSection>
              <div className="mb-6 flex items-center gap-3">
                <DocumentPill
                  active={documentStep === "image"}
                  complete={Boolean(imageCID)}
                  label="Land Image"
                />
                <DocumentPill
                  active={documentStep === "cofo"}
                  complete={Boolean(coFoCID)}
                  label="Certificate"
                />
              </div>

              <div className="mb-6 rounded-[0.95rem] border border-[rgba(180,140,90,0.12)] bg-[#243047] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  {documentStep === "image" ? "Current Upload" : "Current Document"}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-white">
                  {documentStep === "image" ? "Land Image" : "Certificate of Occupancy"}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[rgba(255,255,255,0.68)]">
                  {documentStep === "image"
                    ? "Upload a clear image of the land or property that visually identifies this registered parcel."
                    : "Upload the certificate of occupancy or title-supporting document that proves ownership for this record."}
                </p>
              </div>

              {documentStep === "image" ? (
                <UploadCard
                  label="Land Image"
                  inputId="image-upload"
                  helper="PNG, JPG, GIF or SVG"
                  preview={filePrev}
                  cid={imageCID}
                  accept="image/*"
                  fileName={imageFileName}
                  mimeType={imageMimeType}
                  onChange={(e) => handleFileChange(e, "image")}
                />
              ) : (
                <UploadCard
                  label="Certificate of Occupancy"
                  inputId="cofo-upload"
                  helper="PDF, PNG, JPG, GIF or SVG"
                  preview={coFoFilePrev}
                  cid={coFoCID}
                  accept=".pdf,image/*"
                  fileName={coFoFileName}
                  mimeType={coFoMimeType}
                  onChange={(e) => handleFileChange(e, "cofo")}
                />
              )}
            </StepSection>
          )}

          {activeStep === 2 && (
            <StepSection>
              <div className="rounded-[1rem] border border-[rgba(180,140,90,0.12)] bg-[#111827] p-5">
                <div className="grid grid-cols-1 gap-4 text-sm text-[rgba(255,255,255,0.72)] md:grid-cols-2">
                  <SummaryRow label="Title Number" value={formState.titleNumber} />
                  <SummaryRow label="Number of Plots" value={formState.numberOfPlots} />
                  <SummaryRow label="State" value={formState.state} />
                  <SummaryRow label="LGA" value={formState.lga} />
                  <SummaryRow label="City" value={formState.city} />
                  <SummaryRow
                    label="Assessed Value Per Plot"
                    value={formState.assessedValuePerPlot ? `${formState.assessedValuePerPlot} USDT` : "Not set"}
                  />
                  <SummaryRow label="Land Image" value={imageCID ? "Uploaded" : "Missing"} />
                  <SummaryRow label="Certificate of Occupancy" value={coFoCID ? "Uploaded" : "Missing"} />
                </div>
              </div>

              <div className="mt-6 rounded-[1rem] border border-primary/15 bg-primary/10 p-4 text-sm leading-6 text-[rgba(255,255,255,0.7)]">
                Registration creates the land record onchain. Verification and public listing happen as later,
                separate actions.
              </div>
            </StepSection>
          )}

          <div className="sticky bottom-0 z-10 mt-6 flex flex-col gap-3 border-t border-[rgba(180,140,90,0.08)] bg-[#141d2e]/95 pb-4 pt-4 backdrop-blur-sm sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={goBack}
              disabled={activeStep === 0 || isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-[0.95rem] border border-[rgba(180,140,90,0.16)] px-5 py-3 text-sm font-medium text-[rgba(255,255,255,0.72)] transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>

            {activeStep < 2 ? (
              <button
                type="button"
                onClick={goNext}
                disabled={
                  isSubmitting ||
                  (activeStep === 0 && !canAdvanceFromIdentity) ||
                  (activeStep === 1 && documentStep === "image" && !imageCID) ||
                  (activeStep === 1 && documentStep === "cofo" && !coFoCID)
                }
                className="inline-flex items-center justify-center gap-2 rounded-[0.95rem] bg-primary px-5 py-3 text-sm font-semibold text-[#111827] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {activeStep === 1 && documentStep === "image" ? "Next Document" : "Continue"}
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={registerLandAndRedirect}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-[0.95rem] bg-primary px-5 py-3 text-sm font-semibold text-[#111827] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSubmitting ? "Submitting Record..." : "Submit Land Record"}
              </button>
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

interface StepSectionProps {
  children: React.ReactNode;
}

const StepSection = ({ children }: StepSectionProps) => (
  <div>
    <div className="rounded-[1rem] border border-[rgba(180,140,90,0.1)] bg-[#202a3d] p-5 shadow-[0_1px_2px_rgba(15,23,42,0.12)] md:p-6">{children}</div>
  </div>
);

interface FieldProps {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}

const Field = ({ label, htmlFor, children }: FieldProps) => (
  <label htmlFor={htmlFor} className="flex flex-col gap-2">
    <span className="text-sm font-semibold text-white">{label}</span>
    {children}
  </label>
);

interface UploadCardProps {
  label: string;
  inputId: string;
  helper: string;
  preview: string | null;
  cid: string | null;
  accept: string;
  fileName: string | null;
  mimeType: string | null;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const UploadCard = ({ label, inputId, helper, preview, cid, accept, fileName, mimeType, onChange }: UploadCardProps) => (
  <div className="rounded-[1rem] border border-[rgba(180,140,90,0.12)] bg-[#202a3d] p-4">
    <label htmlFor={inputId} className="block text-sm font-semibold text-white">
      {label}
    </label>
    <div className="relative mt-3">
      <input id={inputId} type="file" className="h-0 w-0" accept={accept} onChange={onChange} />
      {!cid && (
        <label
          htmlFor={inputId}
          className="flex h-56 cursor-pointer flex-col items-center justify-center rounded-[1rem] border-2 border-dashed border-[rgba(180,140,90,0.18)] bg-[#263149] px-6 text-center transition hover:border-primary hover:bg-primary/5"
        >
          <Camera className="mb-4 h-7 w-7 text-[rgba(255,255,255,0.45)]" />
          <p className="text-sm text-[rgba(255,255,255,0.62)]">
            <span className="font-semibold text-white">Click to upload</span> or drag and drop
          </p>
          <p className="mt-2 text-xs text-[rgba(255,255,255,0.42)]">{helper}</p>
        </label>
      )}
    </div>

    {cid && (
      <div className="mt-4 rounded-[1rem] border border-[rgba(180,140,90,0.12)] bg-[#263149] p-4">
        {preview && mimeType?.startsWith("image/") ? (
          <img
            src={`data:${mimeType};base64,${preview}`}
            alt={`${label} preview`}
            className="h-48 w-full rounded-[0.85rem] object-cover"
          />
        ) : (
          <div className="flex h-48 flex-col items-center justify-center rounded-[0.85rem] bg-[#202a3d] text-center">
            <FileText className="h-9 w-9 text-[rgba(255,255,255,0.45)]" />
            <p className="mt-3 text-sm font-semibold text-white">{fileName || label}</p>
            <p className="mt-1 text-xs text-[rgba(255,255,255,0.45)]">Uploaded successfully</p>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">{fileName || label}</p>
            <p className="text-xs text-[rgba(255,255,255,0.45)]">Upload complete</p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`https://${import.meta.env.VITE_PINATA_GATEWAY}/ipfs/${cid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-primary underline"
            >
              View uploaded file
            </a>

            <label
              htmlFor={inputId}
              className="inline-flex cursor-pointer items-center gap-2 rounded-[0.85rem] border border-[rgba(180,140,90,0.12)] px-3 py-2 text-sm font-medium text-[rgba(255,255,255,0.72)] transition hover:border-primary hover:bg-[#202a3d] hover:text-primary"
            >
              <Upload className="h-4 w-4" />
              Replace
            </label>
          </div>
        </div>
      </div>
    )}
  </div>
);

interface DocumentPillProps {
  active: boolean;
  complete: boolean;
  label: string;
}

const DocumentPill = ({ active, complete, label }: DocumentPillProps) => (
  <div
    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${active
        ? "bg-primary text-[#111827]"
        : complete
          ? "bg-emerald-100 text-emerald-800"
          : "bg-[#2b3446] text-[rgba(255,255,255,0.68)]"
      }`}
  >
    {complete ? <CheckCircle2 className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
    {label}
  </div>
);

interface SummaryRowProps {
  label: string;
  value: string | number;
}

const SummaryRow = ({ label, value }: SummaryRowProps) => (
  <div className="rounded-[0.9rem] bg-[#263149] px-4 py-3">
    <p className="text-xs uppercase tracking-[0.16em] text-[rgba(255,255,255,0.45)]">{label}</p>
    <p className="mt-2 text-sm font-semibold text-white">{value || "Not provided"}</p>
  </div>
);

interface StepMetaPillProps {
  label: string;
}

const StepMetaPill = ({ label }: StepMetaPillProps) => (
  <div className="inline-flex items-center rounded-full border border-[rgba(180,140,90,0.12)] bg-[#243047] px-3 py-1.5 text-xs font-medium text-[rgba(255,255,255,0.72)]">
    {label}
  </div>
);

export default Register;
