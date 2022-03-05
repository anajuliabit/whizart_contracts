/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  BaseContract,
  BigNumber,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  PayableOverrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import { FunctionFragment, Result } from "@ethersproject/abi";
import { Listener, Provider } from "@ethersproject/providers";
import { TypedEventFilter, TypedEvent, TypedListener, OnEvent } from "./common";

export interface WhizartBoxInterface extends utils.Interface {
  functions: {
    "artist()": FunctionFragment;
    "c_0xa25ff5b0(bytes32)": FunctionFragment;
    "mint()": FunctionFragment;
    "workshop()": FunctionFragment;
  };

  encodeFunctionData(functionFragment: "artist", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "c_0xa25ff5b0",
    values: [BytesLike]
  ): string;
  encodeFunctionData(functionFragment: "mint", values?: undefined): string;
  encodeFunctionData(functionFragment: "workshop", values?: undefined): string;

  decodeFunctionResult(functionFragment: "artist", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "c_0xa25ff5b0",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "mint", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "workshop", data: BytesLike): Result;

  events: {};
}

export interface WhizartBox extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: WhizartBoxInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    artist(overrides?: CallOverrides): Promise<[string]>;

    c_0xa25ff5b0(
      c__0xa25ff5b0: BytesLike,
      overrides?: CallOverrides
    ): Promise<[void]>;

    mint(
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    workshop(overrides?: CallOverrides): Promise<[string]>;
  };

  artist(overrides?: CallOverrides): Promise<string>;

  c_0xa25ff5b0(
    c__0xa25ff5b0: BytesLike,
    overrides?: CallOverrides
  ): Promise<void>;

  mint(
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  workshop(overrides?: CallOverrides): Promise<string>;

  callStatic: {
    artist(overrides?: CallOverrides): Promise<string>;

    c_0xa25ff5b0(
      c__0xa25ff5b0: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    mint(overrides?: CallOverrides): Promise<void>;

    workshop(overrides?: CallOverrides): Promise<string>;
  };

  filters: {};

  estimateGas: {
    artist(overrides?: CallOverrides): Promise<BigNumber>;

    c_0xa25ff5b0(
      c__0xa25ff5b0: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    mint(
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    workshop(overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    artist(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    c_0xa25ff5b0(
      c__0xa25ff5b0: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    mint(
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    workshop(overrides?: CallOverrides): Promise<PopulatedTransaction>;
  };
}
