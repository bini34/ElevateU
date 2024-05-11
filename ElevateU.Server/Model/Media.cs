public class Media{
    public int MediaId {get; set;}
    public string MediaType { get; set; }
    public byte[] MediaData { get; set; }
    public int PostID {get; set;}
    public Post Post { get; set; }
}