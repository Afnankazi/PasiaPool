/**
 * Payment Redirect Script
 * Automatically redirects users back to the group page after payment completion
 */

(function() {
  // Check if we're on a Finternet payment page
  if (window.location.hostname.includes('finternetlab.io') || 
      window.location.hostname.includes('finternet')) {
    
    // Look for payment success indicators
    const checkPaymentSuccess = () => {
      const successIndicators = [
        'Payment Successful!',
        'payment successful',
        'payment completed',
        'transaction completed',
        'SUCCEEDED',
        'PROCESSING'
      ];
      
      const pageText = document.body.innerText.toLowerCase();
      const hasSuccessIndicator = successIndicators.some(indicator => 
        pageText.includes(indicator.toLowerCase())
      );
      
      if (hasSuccessIndicator) {
        // Extract payment intent ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const paymentIntentId = urlParams.get('intent') || 
                               window.location.pathname.split('/').pop();
        
        if (paymentIntentId) {
          // Try to get redirect info from localStorage
          const redirectInfo = localStorage.getItem(`payment_redirect_${paymentIntentId}`);
          
          if (redirectInfo) {
            const { groupId, participantId, amount, groupName, participantName } = JSON.parse(redirectInfo);
            
            // Show redirect message
            const redirectDiv = document.createElement('div');
            redirectDiv.innerHTML = `
              <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: #10b981;
                color: white;
                padding: 16px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                max-width: 300px;
                font-family: system-ui, -apple-system, sans-serif;
              ">
                <div style="font-weight: bold; margin-bottom: 8px;">
                  Payment Successful! 🎉
                </div>
                <div style="font-size: 14px; margin-bottom: 12px;">
                  Redirecting you back to ${groupName}...
                </div>
                <button onclick="window.close(); window.opener.location.href='/dashboard/groups/${groupId}?payment_success=true&amount=${amount}'" 
                        style="
                          background: white;
                          color: #10b981;
                          border: none;
                          padding: 8px 16px;
                          border-radius: 4px;
                          cursor: pointer;
                          font-weight: bold;
                          width: 100%;
                        ">
                  Return to Group Now
                </button>
              </div>
            `;
            
            document.body.appendChild(redirectDiv);
            
            // Auto redirect after 5 seconds
            setTimeout(() => {
              if (window.opener) {
                window.opener.location.href = `/dashboard/groups/${groupId}?payment_success=true&amount=${amount}`;
                window.close();
              } else {
                window.location.href = `/dashboard/groups/${groupId}?payment_success=true&amount=${amount}`;
              }
            }, 5000);
            
            // Clean up localStorage
            localStorage.removeItem(`payment_redirect_${paymentIntentId}`);
          }
        }
      }
    };
    
    // Check immediately and then every 2 seconds
    checkPaymentSuccess();
    const interval = setInterval(checkPaymentSuccess, 2000);
    
    // Stop checking after 2 minutes
    setTimeout(() => clearInterval(interval), 120000);
  }
})();