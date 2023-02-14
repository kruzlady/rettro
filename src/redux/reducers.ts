import { combineReducers } from 'redux';

import addCash from './addCash';
import additionalAssetsData from './additionalAssetsData';
import appState from './appState';
import charts from './charts';
import contacts from './contacts';
import data from './data';
import editOptions from './editOptions';
import ensRegistration from './ensRegistration';
import explorer from './explorer';
import gas from './gas';
import hiddenTokens from './hiddenTokens';
import keyboardHeight from './keyboardHeight';
import nonceManager from './nonceManager';
import requests from './requests';
import settings from './settings';
import showcaseTokens from './showcaseTokens';
import swap from './swap';
import transactionSignatures from './transactionSignatures';
import uniqueTokens from './uniqueTokens';
import uniswap from './uniswap';
import uniswapLiquidity from './uniswapLiquidity';
import userLists from './userLists';
import usersPositions from './usersPositions';
import walletconnect from './walletconnect';
import wallets from './wallets';

export default combineReducers({
  addCash,
  additionalAssetsData,
  appState,
  charts,
  contacts,
  data,
  editOptions,
  ensRegistration,
  explorer,
  gas,
  hiddenTokens,
  keyboardHeight,
  nonceManager,
  requests,
  settings,
  showcaseTokens,
  swap,
  transactionSignatures,
  uniqueTokens,
  uniswap,
  uniswapLiquidity,
  userLists,
  usersPositions,
  walletconnect,
  wallets,
});
