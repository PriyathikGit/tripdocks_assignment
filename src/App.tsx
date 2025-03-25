import TextEditor from './components/TextEditor'

const App = () => {
  return (
    <div className='flex flex-col items-center justify-center w-full h-screen'>
      <h1 className='text-4xl font-semibold mb-6'>Your text editor</h1>
      <TextEditor/>
    </div>
  )
}

export default App