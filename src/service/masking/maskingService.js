const MaskingService = {

    EMAIL: (emailData) => {
      return emailData.replace(/(\w)(.*?)@(.*)/g,
        (match, firstLetter, emailId, domain) => {
          return firstLetter + 'x'.repeat(emailId.length) + '@' + domain;
        });
      },
  
      NAME: (data) => {
        return data.replace(/(?<=.)./g, 'x');
      },
  
      PHONE: (data) => {
        return data.replace(/.(?=.{4})/g, 'x');
      },
  
      ZIP: (data) => {
        return data.replace(/./g, 'x');
      },
  
      ADDRESS: (data) => {
        return 'xxxxxx'
      }
  
    };
    
    export default MaskingService;
    