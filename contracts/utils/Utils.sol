// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

library Utils {
	function randomSeed(uint256 seed) internal view returns (uint256) {
		return
			uint256(keccak256(abi.encodePacked(block.timestamp, blockhash(block.number - 1), block.difficulty, seed)));
	}

	/// Random [0, modulus)
	function random(uint256 seed, uint256 modulus) internal view returns (uint256 nextSeed, uint256 result) {
		nextSeed = randomSeed(seed);
		result = nextSeed % modulus;
	}

	/// Random [from, to)
	function randomRange(
		uint256 seed,
		uint256 from,
		uint256 to
	) internal view returns (uint256 nextSeed, uint256 result) {
		require(from < to, "Invalid random range");
		(nextSeed, result) = random(seed, to - from);
		result += from;
	}

	/// Weighted random.
	function weightedRandom(uint256 seed, uint256[] memory weights)
		internal
		view
		returns (uint256 nextSeed, uint256 index)
	{
		require(weights.length > 0, "Array must not empty");
		uint256 totalWeight;
		for (uint256 i = 0; i < weights.length; ++i) {
			totalWeight += weights[i];
		}
		uint256 randMod;
		(seed, randMod) = randomRange(seed, 1, totalWeight);
		uint256 total;
		for (uint256 i = 0; i < weights.length; i++) {
			total += weights[i];
			if (randMod <= total) {
				return (seed, i);
			}
		}
		return (seed, 1);
	}
}
