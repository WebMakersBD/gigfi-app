import { useEffect } from 'react';
import { subscribeToEvents, unsubscribeFromEvents } from '../lib/alchemy';

export const useAlchemyEvents = () => {
  useEffect(() => {
    // Subscribe to events when component mounts
    subscribeToEvents();

    // Cleanup subscriptions when component unmounts
    return () => {
      unsubscribeFromEvents();
    };
  }, []);
};