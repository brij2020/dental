import React, { type ChangeEvent, type Dispatch, type SetStateAction } from 'react';

// --- FILE DISPLAY SUB-COMPONENT (Already responsive) ---
const FileDisplayComponent: React.FC<{
    files: File[];
    onRemove: (index: number) => void;
}> = ({ files, onRemove }) => {
    if (files.length === 0) return null;

    return (
        <div className="mt-4 space-y-2">
            <p className="block text-sm font-semibold text-slate-700 mb-2">Uploaded files ({files.length}):</p>
            <div className="max-h-40 overflow-y-auto space-y-2 py-1">
                {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between text-sm text-slate-700 bg-slate-100 p-2 sm:p-3 rounded-sm hover:bg-slate-200 transition-colors">
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                            <span className="material-symbols-outlined text-[19px]">docs</span>
                            <span className="truncate font-medium">{file.name}</span>
                        </div>
                        <div className="flex items-center flex-shrink-0 ml-3">
                            <span className="text-xs text-slate-500 mr-3 hidden sm:block">
                                ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                            <button
                                onClick={() => onRemove(index)}
                                className="text-red-700 w-6 h-6 flex items-center justify-center hover:text-red-700 p-1 rounded-full hover:bg-red-200 transition-colors"
                                title="Remove file"
                            >
                                <span className="material-symbols-sharp">close_small</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


// --- COMPONENT PROPS ---
interface VisitPreparationProps {
    notes: string;
    setNotes: (notes: string) => void;
    uploadedFiles: File[];
    setUploadedFiles: Dispatch<SetStateAction<File[]>>;
    isPreparationRequired: boolean;
    setIsPreparationRequired: (required: boolean) => void;
}

// --- MAIN VISIT PREPARATION COMPONENT (NOW RESPONSIVE) ---
const VisitPreparation: React.FC<VisitPreparationProps> = ({
    notes,
    setNotes,
    uploadedFiles,
    setUploadedFiles,
    isPreparationRequired,
    setIsPreparationRequired
}) => {
    const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const newFiles = Array.from(event.target.files);
            const validFiles = newFiles.filter(file => file.size <= 10 * 1024 * 1024); // 10MB limit
            if (validFiles.length !== newFiles.length) {
                alert('Some files were skipped because they exceed the 10MB limit.');
            }
            setUploadedFiles(prevFiles => [...prevFiles, ...validFiles]);
        }
        event.target.value = ''; // Allow re-uploading the same file
    };

    const handleFileRemove = (index: number) => {
        setUploadedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    };

    const maxNotesLength = 500;

    return (
        <div className="bg-white p-4 rounded-sm border border-gray-300">
            <h2 className="text-[18px] font-semibold flex items-center gap-2 mb-4 text-cyan-800">
                <span className="material-symbols-sharp">docs</span>
                Prepare for Your Visit
            </h2>

            <div className="flex items-start md:items-center space-x-3 p-3 bg-slate-50 rounded-sm border border-slate-200">
                <input
                    id="prepare-visit-checkbox"
                    type="checkbox"
                    checked={isPreparationRequired}
                    onChange={(e) => setIsPreparationRequired(e.target.checked)}
                    className="h-5 w-5 border-gray-300 text-cyan-800 mt-0.5 flex-shrink-0"
                />
                <div className="flex-1">
                    <label htmlFor="prepare-visit-checkbox" className="block text-sm font-medium text-slate-700 cursor-pointer">
                        <strong>Add notes or upload reports</strong> (optional)
                    </label>
                    <p className="text-xs text-slate-400">
                        Share new symptoms, questions, or reports with your doctor before the visit.
                    </p>
                </div>
            </div>

            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isPreparationRequired ? 'max-h-[800px] mt-5 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="space-y-1">
                    <div>
                        <label htmlFor="doctor-notes" className="block text-sm font-semibold text-slate-700 mb-1">Notes for Doctor</label>
                        <textarea
                            id="doctor-notes"
                            rows={5}
                            value={notes}
                            onChange={(e) => {
                                if (e.target.value.length <= maxNotesLength) {
                                    setNotes(e.target.value);
                                }
                            }}
                            className="w-full p-2 border border-slate-300 rounded-sm text-slate-800 resize-none text-sm outline-none"
                            placeholder="Examples: New symptoms, questions about treatment, pain levels..."
                        />
                        <div className="flex justify-end items-center">
                            <span className={`text-[11px] flex-shrink-0 ${notes.length >= maxNotesLength ? 'text-red-500 font-semibold' : 'text-slate-400'}`}>{notes.length}/{maxNotesLength}</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Upload Medical Reports</label>
                        <div className="border-2 border-dashed border-slate-300 rounded-sm hover:border-cyan-700 transition-colors">
                            <label htmlFor="file-upload" className="flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-slate-50 transition-colors">
                                <span className="material-symbols-sharp text-[35px] text-gray-400">upload</span>
                                <span className="text-cyan-700 font-medium text-sm">Click to upload reports</span>
                                <span className="text-xs text-slate-400 text-center mt-1">Supported: PDF, JPG, PNG (Max 10MB)</span>
                            </label>
                            <input id="file-upload" type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="hidden" onChange={handleFileUpload} />
                        </div>
                        <FileDisplayComponent files={uploadedFiles} onRemove={handleFileRemove} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VisitPreparation;