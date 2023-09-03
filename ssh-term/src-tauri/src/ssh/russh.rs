use std::{any, sync::Arc};

use anyhow::Context;
use async_trait::async_trait;
use ssh2::Channel;
use ssh2::Session;
use std::env;
use std::io::prelude::*;
use std::net::TcpListener;
use std::net::TcpStream;
use std::path::Path;
pub async fn test_with_agent() -> Result<(), anyhow::Error> {
    if let Err(e) = test().await {
        println!("{}", e);
    }
    Ok(())
}
/// Consume all available stdout and stderr data.
/// It is important to read both if you are using
/// channel.eof() to make assertions that the stream
/// is complete
fn consume_stdio(channel: &mut Channel) -> (String, String) {
    let mut stdout = String::new();
    channel.read_to_string(&mut stdout).unwrap();

    let mut stderr = String::new();
    channel.stderr().read_to_string(&mut stderr).unwrap();

    println!("stdout: {}", stdout);
    println!("stderr: {}", stderr);

    (stdout, stderr)
}
pub async fn test() -> Result<(), anyhow::Error> {
    println!("first point");
    // Connect to the local SSH server
    let tcp = TcpStream::connect("118.25.23.19:22")?;
    println!("2 point");

    let mut sess = Session::new()?;
    println!("3 point");

    sess.set_tcp_stream(tcp);
    println!("4 point");

    sess.handshake()?;
    println!("5 point");

    sess.userauth_pubkey_file("ubuntu", None, Path::new("d:\\lsk.pem"), None)?;

    if sess.authenticated() {
        println!("6 point");

        let mut channel = sess.channel_session()?;
        println!("7 point");
        channel.exec("ls").unwrap();

        channel.send_eof()?;
        let mut output = String::new();
        channel.read_to_string(&mut output).unwrap();
        print!("{}", output);
    }
    Ok(())
}
