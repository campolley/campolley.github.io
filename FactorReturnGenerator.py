### Day by day calculator for the factor returns that can use the historical or the current days as reference

import pandas as pd
import numpy as np

import duckdb
mem_db = duckdb.connect()

import warnings
warnings.filterwarnings("ignore")

import pandas_market_calendars as mcal
nyse = mcal.get_calendar('NYSE')

import matplotlib.pyplot as plt
import seaborn as sns

import datetime as dt

import statsmodels.formula.api as smf

from polygon import RESTClient

client = RESTClient("XcMpxms7nqIA8GVs1Ka9hpsoZ7kwrDaI")

# Initialize by loading the complete dataset
complete = pd.read_csv('complete_data.csv')

# Iterate through each dated row in the dataset
for idx, row in complete.head(1).iterrows(): ### REMOVE THE HEAD(1) TO RUN FULL LOOP

    ### ADD SOMETHING TO CHECK IF "ANY" COLUMNS OF THE ROW IS A PD.NA VALUE, IF NOT, SKIP TO NEXT ROW
    if row.isna().any() or row['SMB_ret_longshort'] == 0 or row['HML_ret_longshort'] == 0 or row['RMW_ret_longshort'] == 0:
        
        print(f"Working on row {idx} with date {row['date']}")

        # Set the important dates for the iterated row
        current_day = pd.to_datetime(row['date']).date()
        forward_day = pd.to_datetime(row['fdate']).date()
        lag_day = pd.to_datetime(row['ldate']).date()

        # Get ticker list for the investable universe of stocks for the day -- only those with composite figis
        tickers = []
        for t in client.list_tickers(market="stocks", type="CS", active=True, limit=1000, date='2025-06-14'):
            tickers.append(t)
        tickers = pd.DataFrame(tickers)
        tic_list = tickers['ticker'].to_list()

        # Get the vwaps for all stocks as of the current day and one day into the future
        transient = []
        for tic in tic_list:
            try:
                aggs = []
                for a in client.list_aggs(
                    tic,
                    1,
                    "day",
                    current_day,
                    forward_day,
                    adjusted="true",                    # Maybe don't want adjused???
                    sort="asc",
                    limit=120,
                ):
                    aggs.append(a)
                returns_data = pd.DataFrame(aggs)
                returns_data['ticker'] = tic
                transient.append(returns_data)
            except:
                pass
        returns_df = pd.concat(transient)
        returns_df = returns_df[['ticker','vwap','timestamp']]
        returns_df['t']=pd.to_datetime(returns_df['timestamp'], unit='ms', origin='unix', utc=True).dt.tz_convert('US/Eastern').dt.date.astype('datetime64[ns]')
        returns_df['lag_t'] = returns_df['t'].shift(-1)    

        # Isolate current_day values and merge the forward vw onto returns_df to calculate returns
        current_day_returns = returns_df[returns_df['t'].dt.date == current_day]
        sql = '''
        select a.*, b.vwap as forward_vwap
        from current_day_returns as a
        left join returns_df as b
        on a.ticker = b.ticker and a.t = b.lag_t
        '''
        current_day_returns = mem_db.execute(sql).fetchdf()
        current_day_returns['vw_ret'] = current_day_returns['forward_vwap'] / current_day_returns['vwap'] - 1

        # Start with the SMB factor
        if pd.isna(row['SMB_ret_longshort'] or row['SMB_ret_longshort'] == 0):
            print("Starting with SMB factor calculations...")
            # Get market caps for all the investable companies
            SMB_list = []
            mcap_list = []
            big = []
            small = []
            print("Getting market caps for all investable companies...")
            for tic in tic_list:
                try:
                    mcap = client.get_ticker_details(tic, date=lag_day).market_cap
                except:
                    mcap = pd.NA
                if pd.notna(mcap):
                    SMB_list.append({'ticker': tic, 'market_cap': mcap})
                    mcap_list.append(mcap)
                else:
                    pass
            median_mcap = np.median([x for x in mcap_list if pd.notna(x)])
            
            # Assign to Small or Large depending on whether above or below median
            for i, d in enumerate(SMB_list):
                try:
                    if d['market_cap'] > median_mcap:
                        big.append(d['ticker'])
                    else:
                        small.append(d['ticker'])
                except:
                    pass

            # Add the big and small company lists to the dataset
            try:
                complete.loc[idx, 'SMB_long'] = [big]
            except:
                complete.loc[idx, 'SMB_long'] = [[big]]

            try:
                complete.loc[idx, 'SMB_short'] = [small]
            except:
                complete.loc[idx, 'SMB_short'] = [[small]]

            # Add the long only returns to the dataset
            long_ret_list = []
            for tic in small:
                try:
                    long_ret_list.append(current_day_returns[current_day_returns['ticker'] == tic]['vw_ret'].values[0])
                except:
                    pass

            long_ret = np.mean([x for x in long_ret_list if pd.notna(x)])
            complete.loc[idx, 'SMB_ret_long'] = long_ret

            short_ret_list = []
            for tic in big:
                try:
                    short_ret_list.append(current_day_returns[current_day_returns['ticker'] == tic]['vw_ret'].values[0])
                except:
                    pass

            short_ret = np.mean([x for x in short_ret_list if pd.notna(x)])
            complete.loc[idx, 'SMB_ret_short'] = short_ret

            complete.loc[idx, 'SMB_ret_longshort'] = long_ret - short_ret

            # Save the SMB portfolios and returns to the original dataset
            complete.to_csv('complete_data.csv', index=False)

        # Time for HML factor calculations
        if pd.isna(row['HML_ret_longshort'] or row['HML_ret_longshort'] == 0):
            print("Starting with HML factor calculations...")
            HML_list = []
            BM_list = []
            high = []
            low = []

# Could move the calculation fo the mcap values outside of the HML or SMB loops to save a few minutes per full loop

            for tic in tic_list:
                try:
                    financials = []
                    lag = (lag_day - pd.DateOffset(months=4)).date()
                    for f in client.vx.list_stock_financials(tic, timeframe='quarterly', period_of_report_date_lte=lag_day, period_of_report_date_gte=lag):
                        financials.append(f)
                    book = financials[0].financials.balance_sheet.equity.value
                except:
                    book = pd.NA
                if pd.notna(book):
                    try:
                        mcap = client.get_ticker_details(tic, date=lag_day).market_cap
                    except:
                        mcap = pd.NA
                try:
                    book_market = book / mcap
                except:
                    book_market = pd.NA
                if pd.notna(book_market):
                    HML_list.append({'ticker': tic, 'bm': book_market})
                    BM_list.append(book_market)
                else:
                    pass
            
            # Figure out the 30th and 70th percentiles of the BM ratios
            top30 = np.percentile([x for x in BM_list if pd.notna(x)], 70)
            bottom30 = np.percentile([x for x in BM_list if pd.notna(x)], 30)

            # Assign to High or Low depending on whether above 70th or below 30th percentile
            for i, d in enumerate(HML_list):
                try:
                    if d['bm'] >= top30:
                        high.append(d['ticker'])
                    elif d['bm'] <= bottom30:
                        low.append(d['ticker'])
                except:
                    pass

            # Add the value and growth company lists to the dataset
            try:
                complete.loc[idx, 'HML_long'] = [high]
            except:
                complete.loc[idx, 'HML_long'] = [[high]]

            try:
                complete.loc[idx, 'HML_short'] = [low]
            except:
                complete.loc[idx, 'HML_short'] = [[low]]

            # Add the long only returns to the dataset
            long_ret_list = []
            for tic in high:
                try:
                    long_ret_list.append(current_day_returns[current_day_returns['ticker'] == tic]['vw_ret'].values[0])
                except:
                    pass

            long_ret = np.mean([x for x in long_ret_list if pd.notna(x)])
            complete.loc[idx, 'HML_ret_long'] = long_ret

            short_ret_list = []
            for tic in low:
                try:
                    short_ret_list.append(current_day_returns[current_day_returns['ticker'] == tic]['vw_ret'].values[0])
                except:
                    pass

            short_ret = np.mean([x for x in short_ret_list if pd.notna(x)])
            complete.loc[idx, 'HML_ret_short'] = short_ret

            complete.loc[idx, 'HML_ret_longshort'] = long_ret - short_ret

            # Save the HML portfolios and returns to the original dataset
            complete.to_csv('complete_data.csv', index=False)

        # Time for the RMW factor calculations
        if pd.isna(row['RMW_ret_longshort'] or row['RMW_ret_longshort'] == 0):
            print("Starting with RMW factor calculations...")
            RMW_list = []
            profitability_list = []
            robust = []
            weak = []

            for tic in tic_list:
                try:
                    financials = []
                    lag = (lag_day - pd.DateOffset(months=4)).date()
                    for f in client.vx.list_stock_financials(tic, timeframe='quarterly', period_of_report_date_lte=lag_day, period_of_report_date_gte=lag):
                        financials.append(f)
                    gross_profit = financials[0].financials.income_statement.gross_profit.value
                    assets = financials[0].financials.balance_sheet.assets.value
                    profitability = gross_profit / assets
                except:
                    profitability = pd.NA
                if pd.notna(profitability):
                    RMW_list.append({'ticker': tic, 'profitability': profitability})
                    profitability_list.append(profitability)
                else:
                    pass    
            
            # Figure out the 30th and 70th percentiles of the BM ratios
            top30 = np.percentile([x for x in profitability_list if pd.notna(x)], 70)
            bottom30 = np.percentile([x for x in profitability_list if pd.notna(x)], 30)

            # Assign to High or Low depending on whether above 70th or below 30th percentile
            for i, d in enumerate(RMW_list):
                try:
                    if d['profitability'] >= top30:
                        robust.append(d['ticker'])
                    elif d['profitability'] <= bottom30:
                        weak.append(d['ticker'])
                except:
                    pass

            # Add the robust and weak company lists to the dataset
            try:
                complete.loc[idx, 'RMW_long'] = [robust]
            except:
                complete.loc[idx, 'RMW_long'] = [[weak]]

            try:
                complete.loc[idx, 'RMW_short'] = [robust]
            except:
                complete.loc[idx, 'RMW_short'] = [[weak]]
                
            # Add the long only returns to the dataset
            long_ret_list = []
            for tic in robust:
                try:
                    long_ret_list.append(current_day_returns[current_day_returns['ticker'] == tic]['vw_ret'].values[0])
                except:
                    pass

            long_ret = np.mean([x for x in long_ret_list if pd.notna(x)])
            complete.loc[idx, 'RMW_ret_long'] = long_ret

            short_ret_list = []
            for tic in weak:
                try:
                    short_ret_list.append(current_day_returns[current_day_returns['ticker'] == tic]['vw_ret'].values[0])
                except:
                    pass

            short_ret = np.mean([x for x in short_ret_list if pd.notna(x)])
            complete.loc[idx, 'RMW_ret_short'] = short_ret

            complete.loc[idx, 'RMW_ret_longshort'] = long_ret - short_ret

            # Save the HML portfolios and returns to the original dataset
            complete.to_csv('complete_data.csv', index=False)

    else:
        continue