import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { generateQRCodesForAllItems } from '@/scripts/generateQRCodesForAll';
import { Loader2, Download } from 'lucide-react';

export default function GenerateAllQRCodes() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  const handleGenerateAll = async () => {
    setLoading(true);
    setLogs([]);
    setProgress(0);

    // Override console.log to capture logs
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = (...args) => {
      setLogs(prev => [...prev, args.join(' ')]);
      originalLog(...args);
    };
    
    console.error = (...args) => {
      setLogs(prev => [...prev, `ERROR: ${args.join(' ')}`]);
      originalError(...args);
    };

    try {
      await generateQRCodesForAllItems();
    } finally {
      console.log = originalLog;
      console.error = originalError;
      setLoading(false);
    }
  };

  const downloadLogs = () => {
    const blob = new Blob([logs.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qr-generation-logs.txt';
    a.click();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Generate QR Codes for All Items</h1>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">
          ⚠️ This will generate QR codes for ALL existing product items. 
          This operation may take some time depending on the number of items.
        </p>
      </div>

      <Button 
        onClick={handleGenerateAll} 
        disabled={loading}
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating QR Codes...
          </>
        ) : (
          'Generate QR Codes for All Items'
        )}
      </Button>

      {logs.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Generation Logs:</h2>
            <Button variant="outline" onClick={downloadLogs} size="sm">
              <Download className="mr-2 h-4 w-4" />
              Download Logs
            </Button>
          </div>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg h-96 overflow-auto font-mono text-sm">
            {logs.map((log, index) => (
              <div key={index} className="border-b border-gray-700 py-1">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}