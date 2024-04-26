import Button from '@mui/material/Button';
import GoogleLogo from '../../assets/Image/google-logo.svg';
import MicrosoftLogo from '../../assets/Image/microsoft-logo.svg';
import AppleLogo from '../../assets/Image/apple-logo.svg';

import './SignInSocialMedia.css';


function SignInSocialMedia(){

    return(
        <div className='SocialMedia' >
            <Button className='SocialMedia-logo_button' variant="outlined" >
                <span className='social-logo-wrapper'>
                    <img className='SocialMedia-Logo' src={GoogleLogo} alt="GoogleLogo" />
                </span>
                <span>
                    Continue with Google
                </span>
            </Button>
            <Button className='SocialMedia-logo_button' variant="outlined" >
                <span className='social-logo-wrapper'>
                    <img className='SocialMedia-Logo' src={MicrosoftLogo} alt="MicrosoftLogo" />
                </span>
                <span>
                    Continue with Microsoft Account
                </span>
            </Button>
            <Button className='SocialMedia-logo_button' variant="outlined" >
                <span className='social-logo-wrapper'>
                    <img className='SocialMedia-Logo' src={AppleLogo} alt="MicrosoftLogo" />
                </span>
                <span>
                    Continue with Apple
                </span>
            </Button>
        </div>
    );
    
}
export default SignInSocialMedia;

{
/* <div class="social-section">
    <button class="social-btn">
        <span class="social-logo-wrapper">
            <img class="social-logo" src="/assets/google-logo-NePEveMl.svg" alt="Google logo">
        </span>
        <span class="social-text">Continue with Google</span>
        </button><button class="social-btn">
            <span class="social-logo-wrapper">
                <img class="social-logo" src="/assets/microsoft-logo-BUXxQnXH.svg" alt="Microsoft logo">
                    </span><span class="social-text">Continue with Microsoft Account</span></button><button class="social-btn"><span class="social-logo-wrapper"><img class="social-logo" src="/assets/apple-logo-tAoxPOUx.svg" alt="Apple logo"></span><span class="social-text">Continue with Apple</span></button></div> */}