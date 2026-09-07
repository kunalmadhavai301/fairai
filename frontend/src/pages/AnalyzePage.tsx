import React, { useState, useRef } from 'react';
import { Upload, Camera, Edit3, Barcode, MapPin, Scan, Sparkles, AlertCircle, RefreshCw, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { LocationInfo } from '../types';

interface AnalyzePageProps {
  location: LocationInfo;
  onStartAnalysis: (payload: {
    productName?: string;
    brand?: string;
    model?: string;
    category?: string;
    quotedPrice: number;
    barcode?: string;
    imageBuffer?: string;
  }) => void;
  onOpenLocationModal: () => void;
}

export const AnalyzePage: React.FC<AnalyzePageProps> = ({
  location,
  onStartAnalysis,
  onOpenLocationModal,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'manual' | 'barcode'>('camera');
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [quotedPrice, setQuotedPrice] = useState<string>('1200');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);

  // Camera state & snapshot capture
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Start live webcam stream
  const startCamera = async () => {
    setCameraError(null);
    setCapturedImage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err: any) {
      setCameraError('Camera access denied or unavailable. Please use file upload below.');
      setCameraActive(false);
    }
  };

  // Stop camera tracks
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Snap photo from live video stream to canvas
  const handleSnapPhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  // Handle image file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setUploadedImagePreview(evt.target.result as string);
        }
      };
      reader.readAsDataURL(file);
      setProductName(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceVal = Number(quotedPrice) || 1200;
    const finalImageData = capturedImage || uploadedImagePreview || undefined;

    onStartAnalysis({
      productName: productName.trim() || (capturedImage ? 'Scanned Camera Product' : 'Wireless ANC Headphones'),
      brand: brand.trim() || 'Sony',
      model: model.trim() || 'WH-CH720N',
      quotedPrice: priceVal,
      barcode: barcodeInput.trim(),
      imageBuffer: finalImageData,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold mb-2">
            <Scan className="w-3.5 h-3.5" />
            <span>AI Visual Scanner & Review Extraction</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Scan Product Photo</h1>
          <p className="text-xs text-slate-500">Take a live photo or upload an image to extract product details, web reviews & market prices.</p>
        </div>

        {/* Location badge */}
        <button
          onClick={onOpenLocationModal}
          className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 p-3 rounded-2xl border border-slate-200 text-left shrink-0 transition-colors"
        >
          <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Price Context Location</span>
            <span className="text-xs font-bold text-slate-800">{location.formatted}</span>
          </div>
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
          <button
            onClick={() => {
              setActiveTab('camera');
              if (!cameraActive && !capturedImage) startCamera();
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'camera' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-4 h-4 text-blue-600" />
            <span>📸 Take Photo (Camera)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('upload');
              stopCamera();
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'upload' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Image</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('manual');
              stopCamera();
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'manual' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Enter Name</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('barcode');
              stopCamera();
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'barcode' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Barcode className="w-4 h-4" />
            <span>Barcode / SKU</span>
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* TAB A: CAMERA SNAPSHOT */}
          {activeTab === 'camera' && (
            <div className="space-y-4">
              {capturedImage ? (
                /* Photo Captured Preview */
                <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500 bg-slate-900 text-center p-2">
                  <img src={capturedImage} alt="Captured product" className="max-h-72 mx-auto rounded-xl object-contain" />
                  <div className="absolute top-4 left-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Photo Captured Ready</span>
                  </div>

                  <div className="flex justify-center gap-3 mt-3">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="bg-white/20 hover:bg-white/30 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-colors"
                    >
                      Retake Photo
                    </button>
                  </div>
                </div>
              ) : (
                /* Live Webcam Viewfinder */
                <div className="relative rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-800 flex flex-col items-center justify-center min-h-[320px] p-4 text-white">
                  {cameraError ? (
                    <div className="p-4 bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs rounded-xl max-w-md text-center space-y-2">
                      <AlertCircle className="w-6 h-6 mx-auto text-amber-400" />
                      <p>{cameraError}</p>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-1.5 rounded-lg text-xs"
                      >
                        Try Requesting Permission Again
                      </button>
                    </div>
                  ) : (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full max-h-72 rounded-xl object-cover bg-black"
                      ></video>

                      {/* Camera Scanner Reticle Frame */}
                      <div className="absolute inset-8 border-2 border-dashed border-blue-400/70 rounded-2xl pointer-events-none flex items-center justify-center">
                        <span className="bg-slate-900/80 text-blue-300 text-[10px] font-bold px-3 py-1 rounded-full border border-blue-500/30">
                          Align product in frame & click Snap
                        </span>
                      </div>

                      {/* Snap Shutter Button */}
                      <div className="mt-4 flex items-center gap-3">
                        {!cameraActive ? (
                          <button
                            type="button"
                            onClick={startCamera}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md transition-colors"
                          >
                            Open Camera
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleSnapPhoto}
                            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black px-8 py-3 rounded-2xl text-xs shadow-lg hover:shadow-emerald-500/30 flex items-center gap-2 transform active:scale-95 transition-all"
                          >
                            <Camera className="w-5 h-5" />
                            <span>📸 SNAP PHOTO</span>
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Hidden Canvas for Frame Capture */}
              <canvas ref={canvasRef} className="hidden"></canvas>
            </div>
          )}

          {/* TAB B: UPLOAD IMAGE */}
          {activeTab === 'upload' && (
            <div className="p-8 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50/50 text-center space-y-3 hover:border-blue-400 transition-colors">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Drag & Drop Product Box or Label Photo</p>
                <p className="text-[11px] text-slate-400">Supports JPG, PNG, WEBP up to 10MB</p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="file-input"
              />
              <label
                htmlFor="file-input"
                className="inline-block bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-xs transition-colors"
              >
                Browse File
              </label>

              {uploadedImagePreview && (
                <div className="pt-2">
                  <img src={uploadedImagePreview} alt="Upload preview" className="max-h-44 mx-auto rounded-xl border border-slate-200 shadow-xs" />
                  <p className="text-xs text-emerald-600 font-bold mt-1">Image loaded: {selectedFile?.name}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB C: MANUAL */}
          {activeTab === 'manual' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Product Name</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Wireless Headphones X"
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Brand</label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Sony, Philips, Anker"
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Model Number</label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. WH-CH720N"
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB D: BARCODE */}
          {activeTab === 'barcode' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">EAN / UPC / Barcode SKU</label>
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="e.g. 8901234567890"
                className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          )}

          {/* Quoted Price Input */}
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 space-y-2">
            <label className="block text-xs font-bold text-slate-900">
              What price is the local seller charging you?
            </label>
            <div className="relative max-w-sm">
              <span className="absolute left-3.5 top-2.5 font-bold text-slate-600 text-sm">₹</span>
              <input
                type="number"
                value={quotedPrice}
                onChange={(e) => setQuotedPrice(e.target.value)}
                placeholder="1,200"
                className="w-full pl-8 pr-4 py-2.5 bg-white text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
            <p className="text-[11px] text-slate-500">
              FairBuy will analyze web reviews, calculate fair market bounds, and check prices in {location.formatted}.
            </p>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl text-sm shadow-md hover:shadow-blue-500/25 transition-all"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span>Identify Product, Extract Web Reviews & Analyze Price</span>
          </button>
        </form>
      </div>
    </div>
  );
};
