import { useState, useEffect, useCallback } from 'react';
import { CombatAPI, handleApiError } from '../services/api';

export const useCombat = () => {
  const [combatState, setCombatState] = useState({
    characters: [],
    activeCharacter: null,
    combatLog: [],
    isLoading: false,
    error: null
  });

  // Memoized API calls
  const fetchCharacters = useCallback(async () => {
    try {
      setCombatState(prev => ({ ...prev, isLoading: true }));
      const response = await CombatAPI.getCharacters();
      setCombatState(prev => ({
        ...prev,
        characters: response.data,
        isLoading: false
      }));
    } catch (error) {
      handleApiError(error);
      setCombatState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message
      }));
    }
  }, []);

  const initiateCombat = async (characterId, skillId) => {
    try {
      setCombatState(prev => ({ ...prev, isLoading: true }));
      const response = await CombatAPI.initiateCombat({
        characterId,
        skillId
      });
      
      setCombatState(prev => ({
        ...prev,
        combatLog: [response.data.logEntry, ...prev.combatLog],
        isLoading: false
      }));
      
      return response.data;
    } catch (error) {
      handleApiError(error);
      setCombatState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message
      }));
    }
  };

  // Cleanup effect
  useEffect(() => {
    fetchCharacters();
    return () => {
      // Cancel any pending requests
    };
  }, [fetchCharacters]);

  return {
    ...combatState,
    fetchCharacters,
    initiateCombat
  };
};