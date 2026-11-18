let https;
try {
  http = await import('node:https');
} catch (err) {
  console.error('https support is disabled!');
}

const doPostRequest = (data) => {

  return new Promise((resolve, reject) => {
    const options = {
      host: 'reprice.whole9yards.us',
      path: '/corn/B2BSqsSendReceiveNotification.php',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    //create the request object with the callback with the result
    const req = http.request(options, (res) => {
      resolve(JSON.stringify(res.statusCode));
    });

    // handle the possible errors
    req.on('error', (e) => {
      reject(e.message);
    });
    
    //do the request
    req.write(JSON.stringify(data));

    //finish the request
    req.end();
  });
};

const format_payload = (json_data) => {
  
	const ret_data = {};
	ret_data.AnyOfferChangedNotification = {};
	ret_data.AnyOfferChangedNotification.SellerId = json_data?.AnyOfferChangedNotification?.SellerId;
	
	ret_data.AnyOfferChangedNotification.OfferChangeTrigger = {};
	ret_data.AnyOfferChangedNotification.OfferChangeTrigger.MarketplaceId = json_data?.AnyOfferChangedNotification?.OfferChangeTrigger?.MarketplaceId;
	ret_data.AnyOfferChangedNotification.OfferChangeTrigger.ASIN = json_data?.AnyOfferChangedNotification?.OfferChangeTrigger?.ASIN;
	ret_data.AnyOfferChangedNotification.OfferChangeTrigger.ItemCondition = json_data?.AnyOfferChangedNotification?.OfferChangeTrigger?.ItemCondition;
	ret_data.AnyOfferChangedNotification.OfferChangeTrigger.TimeOfOfferChange = json_data?.AnyOfferChangedNotification?.OfferChangeTrigger?.TimeOfOfferChange;
	
	ret_data.AnyOfferChangedNotification.Summary = {};
	ret_data.AnyOfferChangedNotification.Summary.NumberOfOffers = json_data?.AnyOfferChangedNotification?.Summary?.NumberOfOffers;
	ret_data.AnyOfferChangedNotification.Summary.SalesRankings = [];
	ret_data.AnyOfferChangedNotification.Summary.SalesRankings[0] = json_data?.AnyOfferChangedNotification?.Summary?.SalesRankings[0];
	
	if(json_data?.AnyOfferChangedNotification?.Offers && json_data.AnyOfferChangedNotification.Offers.length > 0) { 
		ret_data.AnyOfferChangedNotification.Offers = json_data.AnyOfferChangedNotification.Offers.map( offer_item => {
			const ret_offer_item = {};
			ret_offer_item.SellerId = offer_item?.SellerId;
			ret_offer_item.SellerFeedbackRating = offer_item?.SellerFeedbackRating;
			
			ret_offer_item.ShippingTime = {};
			ret_offer_item.ShippingTime.MinimumHours = offer_item?.ShippingTime?.MinimumHours;
			ret_offer_item.ShippingTime.MaximumHours = offer_item?.ShippingTime?.MaximumHours;
			
			ret_offer_item.ListingPrice = offer_item?.ListingPrice;
			ret_offer_item.Shipping = offer_item?.Shipping;
			ret_offer_item.IsFulfilledByAmazon = offer_item?.IsFulfilledByAmazon;
			ret_offer_item.IsBuyBoxWinner = offer_item?.IsBuyBoxWinner;
			ret_offer_item.IsFeaturedMerchant = offer_item?.IsFeaturedMerchant;
			
			return ret_offer_item;
		});
	}
  return ret_data;
	  
};

export const handler = async(event) => {
    const records = event.Records;
    const payloads = [];
    const formatted_payloads = [];
    const messageIds = [];
    const payloadId = new Date().toISOString() + '.' + Math.floor((Math.random() * 10000000000) + 1);
    for(const notificationRecord of records) {
      let marketplaceId = JSON.parse(notificationRecord.body)?.Payload?.AnyOfferChangedNotification?.OfferChangeTrigger?.MarketplaceId;
      let sent_time = notificationRecord.attributes.SentTimestamp;
      let receive_time = notificationRecord.attributes.ApproximateFirstReceiveTimestamp;
      let final_message_id = notificationRecord.messageId + '-' + sent_time + '-' + receive_time;
      messageIds.push(final_message_id);
      payloads.push(JSON.parse(notificationRecord.body).Payload);
      
      console.log("Message notification ID: ", final_message_id);
  	  
    }
    if(parseInt(payloads.length) > 0){
	    // console.log("RawPayload", payloads); 	
	    // console.log("FormattedPayload", formatted_payloads); 	
      const data = {
        payloadId: payloadId,
  		  messageId: messageIds,
  		  payload: payloads
  	  };
      console.log("post data:", data);
      await doPostRequest(data)
      .then(result => console.log(`Status code: ${result}`))
      .catch(err => console.error(`Error doing the request for the event:   ${err}`));
    }
};
