const MaskingService = {

    EMAIL: (emailData: string) => {
      return emailData.replace(/(\w)(.*?)@(.*)/g,
        (match, firstLetter, emailId, domain) => {
          return firstLetter + 'x'.repeat(emailId.length) + '@' + domain;
        });
      },
  
      NAME: (data: string) => {
        return data.replace(/(?<=.)./g, 'x');
      },
  
      PHONE: (data: string) => {
        return data.replace(/.(?=.{4})/g, 'x');
      },
  
      ZIP: (data: string) => {
        return data.replace(/./g, 'x');
      },
  
      ADDRESS: (data: string) => {
        return 'xxxxxx'
      }
  
    };
    
    export default MaskingService;
    