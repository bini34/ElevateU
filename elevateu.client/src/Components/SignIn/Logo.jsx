import './Logo.css'
import logoImg from '../../assets/Image/logo.png';

function logo(){
    return(
        <header className='logo'>
            <img src={logoImg} alt="logo"/>
        </header>
    );

}
export default logo;