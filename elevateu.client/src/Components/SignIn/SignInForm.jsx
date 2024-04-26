import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import './SignInForm.css';


function SigninForm(){
    return (
        <form>
            <TextField id="userName" label="User Name" variant="outlined" />
            <TextField id="outlined-password-input" label="Password" type="password" autoComplete="current-password" />
            <a href="#">Forgot password?</a>
            <Button id='button' variant="contained">Sign In</Button>
        </form>

    );
}
export default SigninForm;
