import Board from './components/Board';
import './App.css';

function App() {
  return (
    <>
      <header className="app-header">
        <h1>タスク管理ツール</h1>
      </header>
      <main className="app-main">
        <Board />
      </main>
    </>
  );
}

export default App;
