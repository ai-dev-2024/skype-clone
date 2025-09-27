import React from 'react';
import styled from 'styled-components';
import { useTheme } from '../../contexts/ThemeContext';

const TitleBarContainer = styled.div`
  height: 32px;
  background-color: ${props => props.theme.colors.surface};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${props => props.theme.spacing.md};
  -webkit-app-region: drag;
  user-select: none;
`;

const Title = styled.div`
  font-size: ${props => props.theme.fontSize.md};
  font-weight: ${props => props.theme.fontWeight.medium};
  color: ${props => props.theme.colors.text};
`;

const Controls = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.xs};
  -webkit-app-region: no-drag;
`;

const ControlButton = styled.button`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.8;
  }

  &.minimize {
    background-color: #FFBD2E;
  }

  &.maximize {
    background-color: #28CA42;
  }

  &.close {
    background-color: #FF5F57;
  }
`;

const TitleBar: React.FC = () => {
  const { isDarkTheme } = useTheme();

  const handleMinimize = () => {
    if (window.electronAPI) {
      window.electronAPI.minimizeWindow();
    }
  };

  const handleMaximize = () => {
    if (window.electronAPI) {
      window.electronAPI.maximizeWindow();
    }
  };

  const handleClose = () => {
    if (window.electronAPI) {
      window.electronAPI.closeWindow();
    }
  };

  // Only show custom title bar on macOS, Windows uses native
  if (!window.electronAPI || window.electronAPI.platform !== 'darwin') {
    return null;
  }

  return (
    <TitleBarContainer>
      <Title>Skype Clone</Title>
      <Controls>
        <ControlButton className="minimize" onClick={handleMinimize} />
        <ControlButton className="maximize" onClick={handleMaximize} />
        <ControlButton className="close" onClick={handleClose} />
      </Controls>
    </TitleBarContainer>
  );
};

export default TitleBar;
