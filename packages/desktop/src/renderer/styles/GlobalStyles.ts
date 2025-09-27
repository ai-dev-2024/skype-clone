import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html, body, #root {
    height: 100%;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: ${props => props.theme.colors.background};
    color: ${props => props.theme.colors.text};
  }

  body {
    overflow: hidden;
  }

  button, input, textarea, select {
    font-family: inherit;
  }

  button {
    cursor: pointer;
    border: none;
    outline: none;
    background: none;
  }

  input, textarea {
    outline: none;
    border: 1px solid ${props => props.theme.colors.input.border};
    border-radius: ${props => props.theme.borderRadius.md};
    padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
    background-color: ${props => props.theme.colors.input.background};
    color: ${props => props.theme.colors.text};
    font-size: ${props => props.theme.fontSize.md};

    &:focus {
      border-color: ${props => props.theme.colors.input.focus};
    }

    &::placeholder {
      color: ${props => props.theme.colors.textSecondary};
    }
  }

  textarea {
    resize: vertical;
    min-height: 80px;
  }

  /* Scrollbar styling */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${props => props.theme.colors.surface};
  }

  ::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.border};
    border-radius: 4px;

    &:hover {
      background: ${props => props.theme.colors.textSecondary};
    }
  }

  /* Selection styling */
  ::selection {
    background-color: ${props => props.theme.colors.primary}40;
  }

  /* Focus styles */
  *:focus-visible {
    outline: 2px solid ${props => props.theme.colors.primary};
    outline-offset: 2px;
  }

  /* Utility classes */
  .text-center {
    text-align: center;
  }

  .text-left {
    text-align: left;
  }

  .text-right {
    text-align: right;
  }

  .d-flex {
    display: flex;
  }

  .d-block {
    display: block;
  }

  .d-none {
    display: none;
  }

  .justify-center {
    justify-content: center;
  }

  .justify-between {
    justify-content: space-between;
  }

  .justify-around {
    justify-content: space-around;
  }

  .align-center {
    align-items: center;
  }

  .flex-column {
    flex-direction: column;
  }

  .flex-row {
    flex-direction: row;
  }

  .flex-1 {
    flex: 1;
  }

  .w-100 {
    width: 100%;
  }

  .h-100 {
    height: 100%;
  }

  .m-0 {
    margin: 0;
  }

  .p-0 {
    padding: 0;
  }

  .rounded {
    border-radius: ${props => props.theme.borderRadius.md};
  }

  .shadow {
    box-shadow: ${props => props.theme.shadows.md};
  }
`;
