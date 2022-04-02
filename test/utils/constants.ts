import { ethers } from "hardhat";

export const MAINTENANCE_ROLE =
  "0xb06fd1d7ac3cc9ad93e77413fab9fcd3bbd887f5685e519e34e0e80802d074ee";
export const STAFF_ROLE =
  "0x5620a1113a72b02a617976b3f6b15600dd7a8b3a916a9ca01e23119d989a0543";
export const DEFAULT_ADMIN_ROLE = "0x00";
export const DESIGNER_ROLE =
  "0x22c69ab406805e70d07fb1a6502af760601d3b977beadb295a9d76d5852e16a3";
export const MINT_PRICE_ARTIST = ethers.utils.parseUnits("0.0001");
export const MINT_PRICE_WORKSHOP = ethers.utils.parseUnits("0.0001");
