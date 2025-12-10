import SetGame from './components/SetGame';

export default function Home() {
  return (
    <main className="flex flex-col mx-auto px-4 py-4 min-h-screen container">
      <h1 className="mb-4 font-bold text-gray-800 text-3xl md:text-4xl text-center">
        Set Game
      </h1>
      <SetGame />
    </main>
  );
}
