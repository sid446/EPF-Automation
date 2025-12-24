'use client';

import { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'extracted-data.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to extract data');
      }
    } catch (error) {
      console.error(error);
      alert('Error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="w-full max-w-md p-8 bg-white dark:bg-black rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">PDF Data Extractor</h1>
        <p className="mb-4 text-sm text-gray-600">Extracts: Challan Generated On, Establishment Name, Wage Month, Total Amount (Rs), Payment Date</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="pdf" className="block text-sm font-medium mb-2">
              Upload PDF
            </label>
            <input
              type="file"
              id="pdf"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <button
            type="submit"
            disabled={!file || loading}
            className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? 'Processing...' : 'Extract and Download Excel'}
          </button>
        </form>
      </main>
    </div>
  );
}