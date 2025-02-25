import React, { useState, useCallback, useMemo, JSX } from 'react';

interface TicTacToeProps {}
type Player = 'X' | 'O' | '';
type GameState = 'playing' | 'won' | 'draw';

const WINNING_COMBINATIONS: number[][] = [
	[0, 1, 2],
	[3, 4, 5],
	[6, 7, 8], // Rows
	[0, 3, 6],
	[1, 4, 7],
	[2, 5, 8], // Columns
	[0, 4, 8],
	[2, 4, 6], // Diagonals
] as const;

const PLAYERS: Record<number, string> = {
	0: 'X',
	1: 'O',
};

const initialBoard = Array(9).fill('');

const GameStatus: React.FC<{
	winner: Player | null;
	currentPlayer: number;
	gameState: GameState;
}> = ({ winner, currentPlayer, gameState }): JSX.Element => {
	const message = useMemo(() => {
		switch (gameState) {
			case 'won':
				return `Player ${winner} wins!`;
			case 'draw':
				return "It's a draw!";
			default:
				return `Player ${PLAYERS[currentPlayer]}'s turn`;
		}
	}, [gameState, winner, currentPlayer]);

	return <h2 className="text-3xl font-bold text-gray-800">{message}</h2>;
};

const TicTacToe: React.FC<TicTacToeProps> = () => {
	const [board, setBoard] = useState<Player[]>(initialBoard);
	const [currentPlayer, setCurrentPlayer] = useState(0);
	const [winner, setWinner] = useState<Player | null>(null);
	const [winningCells, setWinningCells] = useState<number[]>([]);
	const [gameState, setGameState] = useState<GameState>('playing');

	const checkWinner = useCallback(
		(boardState: Player[]): { winner: Player; winningCells: number[] } | null => {
			for (const combo of WINNING_COMBINATIONS) {
				const [a, b, c] = combo;
				const player = boardState[a];
				if (player && player === boardState[b] && player === boardState[c]) {
					return { winner: player, winningCells: combo };
				}
			}
			return null;
		},
		[],
	);

	const handleMove = useCallback(
		(index: number) => {
			if (gameState !== 'playing' || board[index]) return;

			const newBoard = [...board];
			newBoard[index] = PLAYERS[currentPlayer] as Player;
			setBoard(newBoard);

			const result = checkWinner(newBoard);
			if (result) {
				setWinner(result.winner);
				setWinningCells(result.winningCells);
				setGameState('won');
			} else if (!newBoard.includes('')) {
				setGameState('draw');
			} else {
				setCurrentPlayer((prev) => (prev === 0 ? 1 : 0));
				setGameState('playing');
			}
		},
		[board, currentPlayer, gameState, checkWinner],
	);

	const handleRestart = useCallback(() => {
		setBoard(initialBoard);
		setCurrentPlayer(0);
		setWinner(null);
		setWinningCells([]);
	}, []);

	const isWinningCell = useCallback(
		(position: number): boolean => winningCells.includes(position),
		[winningCells],
	);

	return (
		<div className="flex flex-col items-center gap-8 p-8 bg-gray-50 rounded-lg shadow-lg max-w-lg mx-auto">
			<div className="flex flex-col items-center gap-4">
				<GameStatus
					winner={winner}
					currentPlayer={currentPlayer}
					gameState={gameState}
				/>
				<button
					onClick={handleRestart}
					className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 transition-colors duration-200"
				>
					Restart Game
				</button>
			</div>
			<div className="grid grid-cols-3 gap-4 p-4 bg-white rounded-lg shadow-md">
				{board.map((cell, index) => {
					return (
						<button
							key={index}
							onClick={() => handleMove(index)}
							disabled={!!cell || !!winner}
							className={`h-24 w-24 text-5xl font-bold flex items-center justify-center 
								border-4 rounded-lg
								${!cell && !winner ? 'hover:bg-gray-100 border-gray-200' : 'border-gray-300'}
								${isWinningCell(index) ? 'bg-green-200 border-green-400' : 'bg-white'}
								${!!winner && !isWinningCell(index) ? 'opacity-50' : ''}
								${cell === 'X' ? 'text-blue-600' : 'text-red-600'}
								disabled:cursor-not-allowed
								transition-all duration-200 transform hover:scale-105`}
						>
							{cell}
						</button>
					);
				})}
			</div>
		</div>
	);
};

export default TicTacToe;
