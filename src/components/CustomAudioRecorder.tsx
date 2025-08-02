"use client";
import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface CustomAudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  onNotAllowedOrFound?: (error: any) => void;
}

export function CustomAudioRecorder({ 
  onRecordingComplete, 
  onNotAllowedOrFound 
}: CustomAudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          noiseSuppression: true,
          echoCancellation: true,
        }
      });

      streamRef.current = stream;
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        audioBitsPerSecond: 128000,
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onRecordingComplete(audioBlob);
        
        // Clean up
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      startTimer();
    } catch (error) {
      console.error('Error starting recording:', error);
      onNotAllowedOrFound?.(error);
    }
  }, [onRecordingComplete, onNotAllowedOrFound]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      stopTimer();
    }
  }, [isRecording]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        startTimer();
        setIsPaused(false);
      } else {
        mediaRecorderRef.current.pause();
        stopTimer();
        setIsPaused(true);
      }
    }
  }, [isRecording, isPaused]);

  return (
    <div className="flex flex-col items-center space-y-4 p-4 bg-gray-50 rounded-lg border">
      <div className="flex items-center space-x-4">
        {!isRecording ? (
          <Button
            onClick={startRecording}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-full"
          >
            🎤 Start Recording
          </Button>
        ) : (
          <>
            <Button
              onClick={pauseRecording}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
            >
              {isPaused ? "▶️ Resume" : "⏸️ Pause"}
            </Button>
            <Button
              onClick={stopRecording}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              ⏹️ Stop
            </Button>
          </>
        )}
      </div>
      
      {isRecording && (
        <div className="flex flex-col items-center space-y-2">
          <div className="flex items-center space-x-2">
            {!isPaused && (
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            )}
            <span className="text-lg font-mono">
              {formatTime(recordingTime)}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            {isPaused ? "Recording paused" : "Recording..."}
          </div>
        </div>
      )}
    </div>
  );
}
