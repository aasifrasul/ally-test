import React, { useState, useCallback, useMemo } from 'react';

interface TicTacToeProps {}

const WINNING_COMBINATIONS: string[][] = [
	// Rows
	['r1-c1', 'r1-c2', 'r1-c3'],
	['r2-c1', 'r2-c2', 'r2-c3'],
	['r3-c1', 'r3-c2', 'r3-c3'],
	// Columns
	['r1-c1', 'r2-c1', 'r3-c1'],
	['r1-c2', 'r2-c2', 'r3-c2'],
	['r1-c3', 'r2-c3', 'r3-c3'],
	// Diagonals
	['r1-c1', 'r2-c2', 'r3-c3'],
	['r1-c3', 'r2-c2', 'r3-c1'],
];

const PLAYERS: Record<number, string> = {
	0: 'X',
	1: 'O',
};

type Player = 'X' | 'O' | '';

const TicTacToe: React.FC<TicTacToeProps> = () => {
	const [board, setBoard] = useState<Player[]>(Array(9).fill(''));
	const [currentPlayer, setCurrentPlayer] = useState(0);
	const [winner, setWinner] = useState<Player | 'draw' | null>(null);
	const [winningCells, setWinningCells] = useState<string[]>([]);

	const checkWinner = useCallback(
		(boardState: Player[]): { winner: Player; winningCells: string[] } | null => {
			for (const combo of WINNING_COMBINATIONS) {
				const [a, b, c] = combo;
				const positions = combo.map((pos) => {
					const [row, col] = pos
						.split('-')
						.map((x) => parseInt(x.replace(/[rc]/g, '')) - 1);
					return row * 3 + col;
				});

				if (
					boardState[positions[0]] &&
					boardState[positions[0]] === boardState[positions[1]] &&
					boardState[positions[0]] === boardState[positions[2]]
				) {
					return { winner: boardState[positions[0]] as Player, winningCells: combo };
				}
			}
			return null;
		},
		[],
	);

	const handleMove = useCallback(
		(index: number) => {
			if (winner || board[index]) return;

			const newBoard = [...board];
			newBoard[index] = PLAYERS[currentPlayer] as Player;
			setBoard(newBoard);

			const result = checkWinner(newBoard);
			if (result) {
				setWinner(result.winner);
				setWinningCells(result.winningCells);
			} else if (!newBoard.includes('')) {
				setWinner('draw');
			} else {
				setCurrentPlayer((prev) => (prev === 0 ? 1 : 0));
			}
		},
		[board, currentPlayer, winner, checkWinner],
	);

	const handleRestart = useCallback(() => {
		setBoard(Array(9).fill(''));
		setCurrentPlayer(0);
		setWinner(null);
		setWinningCells([]);
	}, []);

	const getCellPosition = useCallback((index: number): string => {
		const row = Math.floor(index / 3) + 1;
		const col = (index % 3) + 1;
		return `r${row}-c${col}`;
	}, []);

	const isWinningCell = useCallback(
		(position: string): boolean => {
			return winningCells.includes(position);
		},
		[winningCells],
	);

	const gameStatus = useMemo(() => {
		if (winner === 'draw') return "It's a draw!";
		if (winner) return `Player ${winner} wins!`;
		return `Player ${PLAYERS[currentPlayer]}'s turn`;
	}, [winner, currentPlayer]);

	return (
		<div className="flex flex-col items-center gap-8 p-8 bg-gray-50 rounded-lg shadow-lg max-w-lg mx-auto">
			<div className="flex flex-col items-center gap-4">
				<h2 className="text-3xl font-bold text-gray-800">{gameStatus}</h2>
				<button
					onClick={handleRestart}
					className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 transition-colors duration-200"
				>
					Restart Game
				</button>
			</div>

			<div className="grid grid-cols-3 gap-4 p-4 bg-white rounded-lg shadow-md">
				{board.map((cell, index) => {
					const position = getCellPosition(index);
					return (
						<button
							key={position}
							onClick={() => handleMove(index)}
							disabled={!!cell || !!winner}
							className={`h-24 w-24 text-5xl font-bold flex items-center justify-center 
                border-4 rounded-lg
                ${!cell && !winner ? 'hover:bg-gray-100 border-gray-200' : 'border-gray-300'}
                ${isWinningCell(position) ? 'bg-green-200 border-green-400' : 'bg-white'}
                ${!!winner && !isWinningCell(position) ? 'opacity-50' : ''}
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
