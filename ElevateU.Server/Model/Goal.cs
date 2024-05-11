namespace ElevateU.Server.Model
{
    public class Goal
    {
        public int GoalId { get; set; }
        public int UserId { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public double Progress { get; set; }
        public string Category { get; set; }
    }

}
