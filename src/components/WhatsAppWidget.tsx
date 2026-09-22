import { useState } from "react";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getSettings } from "@/api";
import whatsappIcon from "@/assets/whatsapp.png";

export const WhatsAppWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { data: settings } = useQuery({ 
        queryKey: ["settings"], 
        queryFn: getSettings 
    });

    const phoneNumber = settings?.whatsappNumber || "96171016965";
    const welcomeMessage = settings?.whatsappMessage || "Hi there 👋\nHow can I help you?";
    const supportTitle = settings?.whatsappTitle || "Support";
    const statusMessage = settings?.whatsappStatus || "Typically replies within a day";

    const toggleWidget = () => setIsOpen(!isOpen);

    return (
        <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start gap-4">
            {/* Search Widget Window */}
            {isOpen && (
                <div className="mb-4 w-80 md:w-96 rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-300">
                    {/* Header */}
                    <div className="bg-[#00a884] p-4 text-white flex justify-between items-start">
                        <div className="flex gap-3">
                            <div className="relative">
                                <div className="w-12 h-12 rounded-full border-2 border-white/50 bg-white flex items-center justify-center overflow-hidden">
                                    <img src={whatsappIcon} alt="Support" className="w-full h-full object-cover" />
                                </div>
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-[#00a884] rounded-full"></span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">{supportTitle}</h3>
                                <p className="text-xs text-green-100">{statusMessage}</p>
                            </div>
                        </div>
                        <button onClick={toggleWidget} className="hover:bg-white/20 p-1 rounded transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="bg-[#eefeec] p-6 min-h-[200px] flex flex-col justify-center">
                        <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm max-w-[85%] text-gray-800 text-sm whitespace-pre-line">
                            {welcomeMessage}
                            <div className="text-[10px] text-gray-400 text-right mt-1">11:27</div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-3 bg-white border-t">
                        <a
                            href={`https://wa.me/${phoneNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-2.5 rounded-full font-semibold transition-all hover:shadow-lg"
                        >
                            <img src={whatsappIcon} className="w-5 h-5 object-contain brightness-0 invert" alt="WhatsApp" />
                            Chat on WhatsApp
                        </a>
                    </div>
                </div>
            )}

            {/* Floating Button Container with Label */}
            <div className="flex items-center gap-4 group">
                <button
                    onClick={toggleWidget}
                    className="bg-black hover:bg-gray-900 text-white rounded-full shadow-lg transition-all hover:scale-110 flex items-center justify-center w-14 h-14"
                    aria-label="Chat on WhatsApp"
                >
                    <img src={whatsappIcon} className="w-8 h-8 object-contain brightness-0 invert" alt="WhatsApp" />
                </button>

                <div className="bg-white px-4 py-2 rounded-lg shadow-md text-sm font-medium text-gray-800 transition-opacity opacity-100 hidden md:block">
                    Need Help? Chat with us
                </div>
            </div>
        </div>
    );
};

// Replaced by image import in component
