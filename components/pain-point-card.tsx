'use client';

import { useState } from 'react';

interface PainPointCardProps {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  status: string;
  createdAt: Date;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export function PainPointCard(props: PainPointCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async () => {
    setIsProcessing(true);
    await props.onApprove(props.id);
    setIsProcessing(false);
  };

  const handleReject = async () => {
    setIsProcessing(true);
    await props.onReject(props.id);
    setIsProcessing(false);
  };

  const severityClass = props.severity === 'critical' ? 'bg-red-100 text-red-800' :
    props.severity === 'high' ? 'bg-orange-100 text-orange-800' :
    props.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800';

  const statusClass = props.status === 'approved' ? 'bg-green-100 text-green-800' :
    props.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800';

  return (
    <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{props.title}</h3>
          <div className="flex gap-2 mt-2">
            <span className={"px-2 py-1 rounded-full text-xs font-medium " + severityClass}>
              {props.severity}
            </span>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {props.category}
            </span>
            <span className={"px-2 py-1 rounded-full text-xs font-medium " + statusClass}>
              {props.status}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <p className="text-gray-700 line-clamp-2">{props.description}</p>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 text-sm mt-1 hover:underline"
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-gray-700 whitespace-pre-wrap">{props.description}</p>
          <p className="text-xs text-gray-500 mt-3">
            Discovered: {new Date(props.createdAt).toLocaleDateString()}
          </p>
        </div>
      )}

      {props.status === 'pending' && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleApprove}
            disabled={isProcessing}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
          >
            {isProcessing ? 'Processing...' : 'Approve'}
          </button>
          <button
            onClick={handleReject}
            disabled={isProcessing}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:bg-gray-400"
          >
            {isProcessing ? 'Processing...' : 'Reject'}
          </button>
        </div>
      )}
    </div>
  );
}
