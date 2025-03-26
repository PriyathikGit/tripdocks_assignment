import { useState } from 'react';
import TextEditor from './components/TextEditor/TextEditor'

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Toggles the dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark'); // Adds the 'dark' class to the root element
    } else {
      document.documentElement.classList.remove('dark'); // Removes the 'dark' class
    }
  };
  return (
    <div className={`flex flex-col items-center justify-center w-full h-screen 
    ${isDarkMode ? 'bg-black text-white' : 'bg-white text-black'} px-5`}>
      <button
        onClick={toggleDarkMode}
        className="absolute top-4 right-4 px-4 py-2 bg-gray-400 dark:bg-gray-800 text-black dark:text-white rounded text-lg"
      >
        {isDarkMode ? '☀️' : '🌙'}
      </button>
      <h1 className="text-4xl font-semibold mb-6">Your text editor</h1>
      <TextEditor />
    </div>
  )
}

export default App