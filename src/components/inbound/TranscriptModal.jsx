import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Play, 
  Pause, 
  Volume2, 
  Calendar, 
  Clock, 
  Phone,
  Users,
  FileText,
  ExternalLink
} from 'lucide-react';

const TranscriptModal = ({ call, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getSentimentColor = (score) => {
    if (score >= 0.6) return 'text-green-600 bg-green-100';
    if (score >= 0.4) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getSentimentText = (score) => {
    if (score >= 0.6) return 'Positive';
    if (score >= 0.4) return 'Neutral';
    return 'Negative';
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // TODO: Implement actual audio playback
  };

  const handleDownloadTranscript = () => {
    const transcriptText = call.transcript?.full_text || 'No transcript available';
    const blob = new Blob([transcriptText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${call.id}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleDownloadRecording = () => {
    if (call.recording_url) {
      const a = document.createElement('a');
      a.href = call.recording_url;
      a.download = `recording-${call.id}.mp3`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Call Transcript</h3>
                  <p className="text-sm text-gray-500">Call ID: {call.id}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-6">
            {/* Call Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Phone Numbers</p>
                    <p className="text-sm text-gray-600">
                      {call.phone_from} → {call.phone_to}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Duration</p>
                    <p className="text-sm text-gray-600">
                      {formatDuration(call.duration_seconds || 0)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Date & Time</p>
                    <p className="text-sm text-gray-600">
                      {formatTimestamp(call.created_at)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 flex items-center justify-center">
                    <div className={`w-3 h-3 rounded-full ${
                      call.status === 'answered' ? 'bg-green-400' : 
                      call.status === 'no-answer' ? 'bg-yellow-400' : 'bg-red-400'
                    }`}></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Status</p>
                    <p className="text-sm text-gray-600 capitalize">{call.status || 'Unknown'}</p>
                  </div>
                </div>
                
                {call.sentiment_score !== undefined && (
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 text-gray-400">😊</div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Sentiment</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSentimentColor(call.sentiment_score)}`}>
                        {getSentimentText(call.sentiment_score)} ({(call.sentiment_score * 100).toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                )}
                
                {call.lead_extracted && (
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Lead Status</p>
                      <p className="text-sm text-green-600">Extracted</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recording Player */}
            {call.recording_url && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900">Recording</h4>
                  <button
                    onClick={handleDownloadRecording}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </button>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handlePlayPause}
                    className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{formatDuration(currentTime)}</span>
                      <span>{formatDuration(duration)}</span>
                    </div>
                  </div>
                  <Volume2 className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            )}

            {/* Transcript */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900">Transcript</h4>
                <button
                  onClick={handleDownloadTranscript}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </button>
              </div>
              
              {call.transcript?.full_text ? (
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <div className="prose prose-sm max-w-none">
                    {call.transcript.segments && call.transcript.segments.length > 0 ? (
                      <div className="space-y-3">
                        {call.transcript.segments.map((segment, index) => (
                          <div key={index} className="flex space-x-3">
                            <div className="flex-shrink-0">
                              <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${
                                segment.speaker === 'Agent' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {segment.speaker || 'Unknown'}
                              </span>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-900">{segment.text}</p>
                              {segment.timestamp && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {formatDuration(segment.timestamp)}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">
                        {call.transcript.full_text}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No transcript available for this call</p>
                </div>
              )}
            </div>

            {/* Lead Information */}
            {call.lead && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-gray-900">Extracted Lead</h4>
                  <a
                    href={`/inbound/leads/${call.lead.id}`}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    View Lead
                    <ExternalLink className="w-4 h-4 ml-1" />
                  </a>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Contact Info</p>
                      <p className="text-sm text-gray-600">
                        {call.lead.contact?.name && `Name: ${call.lead.contact.name}`}
                        {call.lead.contact?.phone && `\nPhone: ${call.lead.contact.phone}`}
                        {call.lead.contact?.email && `\nEmail: ${call.lead.contact.email}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Intent & Urgency</p>
                      <p className="text-sm text-gray-600">
                        {call.lead.intent && `Intent: ${call.lead.intent}`}
                        {call.lead.urgency && `\nUrgency: ${call.lead.urgency}`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranscriptModal;
