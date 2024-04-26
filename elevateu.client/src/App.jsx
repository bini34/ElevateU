import './App.css';
import SigninForm from './Components/SignIn/SignInForm';
import Logo from './Components/SignIn/Logo';
import Divider from '@mui/material/Divider';
import SignInSocialMedia from './Components/SignIn/SignInSocialMedia';


function App() {
    
    return (
        <div>
            <Logo /> 
            <br />
            <div className='SignInform'>
               <div className='heading-text'>
                 <h1>Welcome Back</h1>
               </div>
               <br />
               <SigninForm />
               <div className='create-Account'>
                <p>Don't have an account? <a href="#">Sign Up</a></p>
               </div>
               <br />
               <Divider>OR</Divider>              
               <br />
               <SignInSocialMedia/>
            </div>
            
        </div>    
    );

}

export default App;