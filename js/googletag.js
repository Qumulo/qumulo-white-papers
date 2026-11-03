window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}

gtag('js', new Date());

// Restrict GA to the current hostname only so it doesn't set root .qumulo.com cookies
gtag('config', 'G-PRC1WZMZME', { 
  cookie_flags: 'SameSite=None;Secure',
  cookie_domain: window.location.hostname
});
