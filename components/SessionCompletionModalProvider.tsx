import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import { SessionCompletionModal } from './SessionCompletionModal'; // Adjusted path

interface SessionCompletionData {
  currentTime: string;
  onSubmitCallback: (entryText?: string) => void;
}

interface SessionCompletionModalContextType {
  show: (data: SessionCompletionData) => void;
  hide: () => void;
  isVisible: boolean;
}

const SessionCompletionModalContext = createContext<
  SessionCompletionModalContextType | undefined
>(undefined);

export function useSessionCompletionModal() {
  const context = useContext(SessionCompletionModalContext);
  if (!context) {
    throw new Error(
      'useSessionCompletionModal must be used within a SessionCompletionModalProvider'
    );
  }
  return context;
}

export function SessionCompletionModalProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [modalData, setModalData] = useState<SessionCompletionData | null>(
    null
  );

  const show = useCallback((data: SessionCompletionData) => {
    setModalData(data);
    setIsVisible(true);
  }, []);

  const hide = useCallback(() => {
    setIsVisible(false);
    setModalData(null); // Clear data when hiding
  }, []);

  const handleSubmit = useCallback(
    (entryText?: string) => {
      if (modalData?.onSubmitCallback) {
        modalData.onSubmitCallback(entryText);
      }
      hide();
    },
    [modalData, hide]
  );

  return (
    <SessionCompletionModalContext.Provider value={{ show, hide, isVisible }}>
      {children}
      {modalData && ( // Render modal only when there's data
        <SessionCompletionModal
          visible={isVisible}
          onClose={hide} // Modal's own "Skip" or backdrop press should just hide it.
          // The specific "skip" logic will be part of the onSubmitCallback if entryText is empty.
          onSubmit={handleSubmit} // This is when "Save" is pressed in the modal.
          currentTime={modalData.currentTime}
        />
      )}
    </SessionCompletionModalContext.Provider>
  );
}
