import QrCodeWithLogo from '@components/QrCodeWithLogo';

export default function DemoQrCodePage() {
    return (
        <div className="main-content flex flex-col items-center justify-center min-h-screen bg-base-100">
            <h1 className="text-2xl font-bold mb-6">QR Code Demo</h1>
            <div className="card bg-white p-8 rounded-lg shadow-xl flex flex-col items-center">
                <QrCodeWithLogo
                    value="https://mathquest.alexisfles.ch/teacher/projection/3152"
                    size={256}
                    logoWidth={48}
                    logoHeight={48}
                />
                <div className="mt-4 text-center text-base font-mono text-primary">
                    https://mathquest.alexisfles.ch/teacher/projection/3152
                </div>
            </div>
        </div>
    );
}
