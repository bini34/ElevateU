namespace ElevateU.Server.Model
{
    public class Profiles
    {
        public int ProfileID { get; set; }
        public int UserID { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Bio { get; set; }
        public string ProfilePictureURL { get; set; }
        public string Location { get; set; }
        public DateOnly Birthdate { get; set; }
    }
}
