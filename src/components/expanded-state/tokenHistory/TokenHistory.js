import React, { useEffect, useState } from 'react';
import { Column, ColumnWithMargins, Row, RowWithMargins } from '../../layout';
import { apiGetTokenHistory } from '@rainbow-me/handlers/opensea-api';
import { FlatList, View } from "react-native";
import logger from 'logger';
import RadialGradient from 'react-native-radial-gradient';
import { Text } from '../../text';
import styled from 'styled-components';
import { getHumanReadableDateWithoutOn } from '@rainbow-me/helpers/transactions';
import { useTheme } from '../../../context/ThemeContext';

/**
 * Requirements: 
 * A Collapsible "History" Tab under expanded NFT States
 * Use Opensea API to display:
 * Minting - Sales - Transfers - Listings - Cancelled Listings
 * Scrollable horizonatally
 */

const eventTypes = {
  SALE: 'successful',
  TRANSFER: 'transfer',
  LIST: 'created',
  DELIST: 'cancelled',
  MINT: 'mint',
};

const eventPhrases  = {
  SALE: `Sold for `,
  LIST: `Listed for `,
  TRANSFER: `Sent to `,
  DELIST: `Delisted`,
  MINT:`Minted`,
};

const eventSymbols = {
  SALE: `􀋢`,
  LIST: `􀎧`,
  TRANSFER: `􀈠`,
  DELIST: `􀎩`,
  MINT: `􀎛`,
};

const TokenHistory = ({ 
    contractAndToken,
    color
  }) => {

  const [tokenHistory, setTokenHistory] = useState([]);
  const [contractAddress, setContractAddress] = useState("");
  const [tokenID, setTokenID] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { isDarkMode, colors } = useTheme();

  useEffect(async() => {
    const tokenInfoArray = contractAndToken.split("/");
    setContractAddress(tokenInfoArray[0]);
    setTokenID(tokenInfoArray[1]);
  });

  //Query opensea using the contract address + tokenID
  useEffect(async() => {
    await apiGetTokenHistory(contractAddress, tokenID)
    .then(result => {
      setTokenHistory(result);
      setIsLoading(false);
    });
  }, [contractAddress, tokenID]);

  const Gradient = styled(RadialGradient).attrs(
    ({ theme: { colors } }) => ({
      center: [0, 0],
      colors:  [colors.whiteLabel, color]
    })
  )`
    position: absolute;
    border-radius: 5;
    width: 10;
    height: 10;
    overflow: hidden;
  `;

  const renderItem = ({ item, index }) => {

    var isFirst = false;
    var symbol;
    var phrase;
    var suffix;

    if (index == 0) {
      isFirst = true;
    }

    switch (item.event_type) {
      case eventTypes.TRANSFER:
        symbol = eventSymbols.TRANSFER;
        phrase = eventPhrases.TRANSFER;
        suffix = `${item.to_account}`;
        return renderHistoryDescription({ symbol, phrase, item, suffix, isFirst });
      case eventTypes.MINT:
        symbol = eventSymbols.MINT;
        phrase = eventPhrases.MINT;
        suffix = ``;
        return renderHistoryDescription({ symbol, phrase, item, suffix, isFirst });
      case eventTypes.SALE:
        symbol = eventSymbols.SALE;
        phrase = eventPhrases.SALE;
        suffix = `${item.sale_amount} ETH`;
        return renderHistoryDescription({ symbol, phrase, item, suffix, isFirst });
      case eventTypes.LIST:
        symbol = eventSymbols.LIST;
        phrase = eventPhrases.LIST;
        suffix = `${item.list_amount} ETH`;
        return renderHistoryDescription({ symbol, phrase, item, suffix, isFirst });
      case eventTypes.DELIST:
        symbol = eventSymbols.DELIST;
        phrase = eventPhrases.DELIST;
        suffix = ``;
        return renderHistoryDescription({ symbol, phrase, item, suffix, isFirst });
    }

  }

  const renderHistoryDescription = ({ symbol, phrase, item, suffix, isFirst }) => {
    const date = getHumanReadableDateWithoutOn(new Date(item.created_date).getTime()/1000);
    return (
      <Column>
      
        {/*
          Radial Gradient + Line row
         */ }
        <Row style = {{ marginBottom: 1 }}> 
          <Gradient color={colors} />
          { isFirst ? <View style={{ height: 3, marginTop: 3 }} /> : <View style={{ height: 3, width: 150, backgroundColor: color, opacity: 0.1, marginTop: 3, marginLeft: 15, marginRight: 6 }} /> }
        </Row>
        
        {/*
          Date Row
         */ }
        <Row style = {{ marginBottom: -6 }}>
          <Text
            align="left"
            color={color}
            lineHeight="loosest"
            size="smedium"
            weight="heavy"
          >
          {date}     
          </Text>
        </Row>
        
        {/*
          Symbol + Phrase Row
         */ }
        <Row>
          <Text
            align="left"
            color={color}
            lineHeight="loosest"
            size="smedium"
            weight="heavy"
          >
            {symbol}
          </Text>
          <Text
            align="right"
            color={colors.whiteLabel}
            lineHeight="loosest"
            size="smedium"
            weight="heavy"
          >
            {phrase}{suffix}
          </Text>
        </Row>

      </Column>
    )
  }

  return (
    <FlatList
      data={tokenHistory}
      renderItem={({item, index}) => renderItem({ item, index })}
      horizontal={true}
      inverted={true}
      showsHorizontalScrollIndicator={false}
    />
  )
}

export default TokenHistory;

